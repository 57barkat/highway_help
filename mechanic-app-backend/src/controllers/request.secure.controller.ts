import { Request as ExRequest, Response } from "express";
import { getDistance } from "geolib";
import { In, IsNull, Not, Repository } from "typeorm";
import { AppDataSource } from "../config/db";
import { Offer } from "../entities/Offer";
import { Request as JobRequest, RequestStatus } from "../entities/Request";
import { AppSetting } from "../entities/AppSetting";
import { User, UserRole } from "../entities/User";
import { io, onlineMechanics } from "../index";

interface AuthRequest extends ExRequest {
  user?: User;
}

interface CreateRequestBody {
  problemType?: string;
  lat?: number;
  lng?: number;
  description?: string;
  areaName?: string;
  radius?: number;
}

const ACTIVE_REQUEST_STATUSES: RequestStatus[] = [
  "pending",
  "accepted",
  "arrived",
  "working",
];
const PROBLEM_RATES: Record<string, { base: number; perKm: number }> = {
  "Flat Tire": { base: 150, perKm: 40 },
  "Battery Jump": { base: 100, perKm: 30 },
  "Engine Issue": { base: 300, perKm: 60 },
  "Fuel Delivery": { base: 80, perKm: 30 },
  "Tow Required": { base: 500, perKm: 100 },
  "Locked Out": { base: 120, perKm: 40 },
  "General Help": { base: 100, perKm: 25 },
};
const requestLog = (label: string, payload?: Record<string, unknown>) => {
  console.log(
    `[request-flow] ${new Date().toISOString()} ${label}`,
    payload ? JSON.stringify(payload) : "",
  );
};

const getVisibleMechanics = () =>
  Array.from(onlineMechanics.values()).filter(
    (mechanic) =>
      mechanic.lat !== null &&
      mechanic.lng !== null &&
      !mechanic.isBusy &&
      mechanic.availableBalance >= 0,
  );

const emitMechanicsUpdate = () => {
  io.emit("mechanics:update", getVisibleMechanics());
};

const ensureRole = (
  user: User | undefined,
  allowedRoles: UserRole[],
  res: Response,
) => {
  if (!user || !allowedRoles.includes(user.role)) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }

  return true;
};

const isValidCoordinate = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value);

const parseRadius = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 5;
  }

  return Math.min(Math.max(parsed, 3), 30);
};

const hasError = <T extends { error?: { status: number; message: string } }>(
  value: T,
): value is T & { error: { status: number; message: string } } =>
  value.error !== undefined;

const deleteOffersForRequestIds = async (
  requestRepo: Repository<JobRequest>,
  requestIds: number[],
) => {
  if (requestIds.length === 0) {
    return;
  }

  await requestRepo.manager
    .createQueryBuilder()
    .delete()
    .from(Offer)
    .where(`"requestId" IN (:...requestIds)`, { requestIds })
    .execute();
};

const schedulePendingRequestTimeout = (requestId: number) => {
  setTimeout(
    async () => {
      try {
        await AppDataSource.transaction(async (manager) => {
          const requestRepo = manager.getRepository(JobRequest);
          const request = await requestRepo
            .createQueryBuilder("request")
            .where("request.id = :requestId", { requestId })
            .setLock("pessimistic_write")
            .getOne();

          if (!request || request.status !== "pending" || request.helper) {
            return;
          }

          const requestWithRelations = await requestRepo.findOne({
            where: { id: request.id },
            relations: ["user", "helper"],
          });

          if (!requestWithRelations) {
            return;
          }

          request.status = "cancelled";
          await requestRepo.save(request);
          await deleteOffersForRequestIds(requestRepo, [request.id]);

          io.emit("request:unavailable", { requestId: request.id });
          io.to(`user_${requestWithRelations.user.id}`).emit("ride:cancelled", {
            requestId: request.id,
            cancelledByRole: "system",
            reason: "timeout",
          });
        });
      } catch (error) {
        console.error("Request timeout processing error:", error);
      }
    },
    5 * 60 * 1000,
  );
};

export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureRole(req.user, [UserRole.USER], res)) {
      return;
    }

    const { problemType, lat, lng, description, areaName, radius } =
      req.body as CreateRequestBody;
    console.log("Create request payload:", req.body);

    const trimmedDescription = description?.trim();

    if (
      !problemType ||
      !trimmedDescription ||
      !isValidCoordinate(lat) ||
      !isValidCoordinate(lng)
    ) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    const searchRadius = parseRadius(radius);
    const user = req.user as User;
    const requestLat = lat as number;
    const requestLng = lng as number;
    const userRepo = AppDataSource.getRepository(User);

    const onlineHelpers = await userRepo.find({
      where: {
        role: UserRole.HELPER,
        isOnline: true,
        isBusy: false,
        lat: Not(IsNull()),
        lng: Not(IsNull()),
      },
    });

    const pricing = PROBLEM_RATES[problemType] || { base: 100, perKm: 50 };
    let suggestedPrice = pricing.base;

    if (onlineHelpers.length > 0) {
      const distances = onlineHelpers.map((helper) =>
        getDistance(
          { lat: requestLat, lng: requestLng },
          { lat: helper.lat as number, lng: helper.lng as number },
        ),
      );
      suggestedPrice += (Math.min(...distances) / 1000) * pricing.perKm;
    }

    const request = await AppDataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(JobRequest);
      const existingRequests = await requestRepo
        .createQueryBuilder("request")
        .where(`request."userId" = :userId`, { userId: user.id })
        .andWhere("request.status IN (:...statuses)", {
          statuses: ["pending", "accepted"],
        })
        .setLock("pessimistic_write")
        .getMany();

      if (existingRequests.length > 0) {
        const existingIds = existingRequests.map((item) => item.id);
        await requestRepo
          .createQueryBuilder()
          .update(JobRequest)
          .set({ status: "cancelled" })
          .where("id IN (:...existingIds)", { existingIds })
          .execute();
        await deleteOffersForRequestIds(requestRepo, existingIds);

        existingRequests.forEach((item) => {
          io.emit("request:unavailable", { requestId: item.id });
          io.to(`user_${user.id}`).emit("ride:cancelled", {
            requestId: item.id,
            cancelledByRole: "system",
            reason: "replaced",
          });
        });
      }

      const newRequest = requestRepo.create({
        user,
        problemType,
        description: trimmedDescription,
        areaName,
        lat,
        lng,
        status: "pending",
        suggestedPrice: Math.round(suggestedPrice),
      });

      return requestRepo.save(newRequest);
    });

    let foundNearby = false;

    for (const mechanic of getVisibleMechanics()) {
      const distanceKm =
        getDistance(
          { lat: requestLat, lng: requestLng },
          { lat: mechanic.lat as number, lng: mechanic.lng as number },
        ) / 1000;

      if (distanceKm > searchRadius) {
        continue;
      }

      foundNearby = true;
      requestLog("request:new emit", {
        requestId: request.id,
        helperUserId: mechanic.userId,
        distanceKm: Number(distanceKm.toFixed(2)),
        radiusKm: searchRadius,
      });
      io.to(mechanic.socketId).emit("request:new", {
        requestId: request.id,
        userId: user.id,
        userName: user.name,
        problemType,
        description: trimmedDescription,
        areaName,
        lat,
        lng,
        suggestedPrice: request.suggestedPrice,
        status: request.status,
        distance: distanceKm.toFixed(1),
      });
    }

    schedulePendingRequestTimeout(request.id);

    return res.status(201).json({
      message: foundNearby
        ? "Request created"
        : "Request created but no one nearby",
      noNearbyFound: !foundNearby,
      currentRadius: searchRadius,
      request: {
        id: request.id,
        userId: user.id,
        userName: user.name,
        problemType,
        description: trimmedDescription,
        areaName,
        lat,
        lng,
        suggestedPrice: request.suggestedPrice,
        status: request.status,
      },
    });
  } catch (err) {
    console.error("Create request error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const makeOffer = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureRole(req.user, [UserRole.HELPER], res)) {
      return;
    }

    const { requestId, offeredPrice } = req.body as {
      requestId?: number;
      offeredPrice?: number;
    };
    const mechanic = req.user as User;
    const parsedPrice = Number(offeredPrice);

    if (!requestId || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    if (mechanic.availableBalance < 0) {
      return res.status(403).json({ message: "Top up wallet before offering" });
    }

    const result = await AppDataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(JobRequest);
      const offerRepo = manager.getRepository(Offer);

      const request = await requestRepo
        .createQueryBuilder("request")
        .where("request.id = :requestId", { requestId })
        .setLock("pessimistic_write")
        .getOne();

      if (!request || request.status !== "pending" || request.helper) {
        return { error: { status: 400, message: "Request not active" } };
      }

      const lastOffer = await offerRepo.findOne({
        where: { request: { id: requestId }, mechanic: { id: mechanic.id } },
        order: { createdAt: "DESC" },
      });

      if (lastOffer) {
        const diffInSeconds = Math.floor(
          (Date.now() - new Date(lastOffer.createdAt).getTime()) / 1000,
        );

        if (diffInSeconds < 60) {
          return {
            error: {
              status: 429,
              message: `Please wait ${60 - diffInSeconds} seconds before updating your offer.`,
            },
          };
        }
      }

      const offer = offerRepo.create({
        mechanic,
        request,
        offeredPrice: Math.round(parsedPrice),
      });

      const savedOffer = await offerRepo.save(offer);

      const requestWithUser = await requestRepo.findOne({
        where: { id: request.id },
        relations: ["user"],
      });

      return { offer: savedOffer, request: requestWithUser ?? request };
    });

    if (hasError(result)) {
      return res
        .status(result.error.status)
        .json({ message: result.error.message });
    }

    const rawDistance =
      mechanic.lat !== null && mechanic.lng !== null
        ? getDistance(
            { lat: mechanic.lat, lng: mechanic.lng },
            { lat: result.request.lat, lng: result.request.lng },
          ) / 1000
        : null;

    io.to(`user_${result.request.user.id}`).emit("offer:new", {
      id: result.offer.id,
      requestId: result.request.id,
      offeredPrice: Math.round(result.offer.offeredPrice),
      distanceKm: rawDistance ? Number(rawDistance.toFixed(2)) : null,
      helper: {
        userId: mechanic.id,
        name: mechanic.name,
        phoneNumber: mechanic.phoneNumber,
        lat: mechanic.lat,
        lng: mechanic.lng,
        rating: mechanic.rating || 0,
        ratingCount: mechanic.ratingCount || 0,
      },
    });

    return res.json({ message: "Offer sent", offerId: result.offer.id });
  } catch (err) {
    console.error("Make offer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const acceptOffer = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureRole(req.user, [UserRole.USER], res)) {
      return;
    }

    const { offerId } = req.body as { offerId?: number };
    const user = req.user as User;

    if (!offerId) {
      return res.status(400).json({ message: "offerId is required" });
    }

    const result = await AppDataSource.transaction(async (manager) => {
      const offerRepo = manager.getRepository(Offer);
      const requestRepo = manager.getRepository(JobRequest);
      const userRepo = manager.getRepository(User);

      const lockedOffer = await offerRepo
        .createQueryBuilder("offer")
        .where("offer.id = :offerId", { offerId })
        .setLock("pessimistic_write")
        .getOne();

      if (!lockedOffer) {
        return { error: { status: 404, message: "Offer not found" } };
      }

      const offer = await offerRepo.findOne({
        where: { id: lockedOffer.id },
        relations: ["request", "mechanic"],
      });

      if (!offer) {
        return { error: { status: 404, message: "Offer not found" } };
      }

      const request = await requestRepo
        .createQueryBuilder("request")
        .where("request.id = :requestId", { requestId: offer.request.id })
        .setLock("pessimistic_write")
        .getOne();

      if (!request || request.status !== "pending" || request.helper) {
        return {
          error: { status: 409, message: "Request no longer available" },
        };
      }

      const requestWithUser = await requestRepo.findOne({
        where: { id: request.id },
        relations: ["user"],
      });

      if (!requestWithUser || requestWithUser.user.id !== user.id) {
        return { error: { status: 403, message: "Forbidden" } };
      }

      const helperProfile = await userRepo.findOne({
        where: { id: offer.mechanic.id },
        lock: { mode: "pessimistic_write" },
      });

      if (
        !helperProfile ||
        helperProfile.isBusy ||
        helperProfile.availableBalance < 0
      ) {
        return {
          error: { status: 409, message: "Helper is no longer available" },
        };
      }

      offer.accepted = true;
      request.status = "accepted";
      request.helper = helperProfile;
      helperProfile.isBusy = true;

      await offerRepo.save(offer);
      await requestRepo.save(request);
      await userRepo.save(helperProfile);
      await offerRepo.delete({
        request: { id: request.id },
        accepted: false,
      });

      return { request: requestWithUser, mechanic: helperProfile, offer };
    });

    if (hasError(result)) {
      return res
        .status(result.error.status)
        .json({ message: result.error.message });
    }

    const memoryMechanic = onlineMechanics.get(result.mechanic.id);
    if (memoryMechanic) {
      memoryMechanic.isBusy = true;
    }

    io.emit("request:unavailable", { requestId: result.request.id });

    const navigationData = {
      requestId: result.request.id,
      userLocation: { lat: result.request.lat, lng: result.request.lng },
      helperLocation: { lat: result.mechanic.lat, lng: result.mechanic.lng },
      offeredPrice: Math.round(result.offer.offeredPrice),
      helperName: result.mechanic.name,
      helperPhoneNumber: result.mechanic.phoneNumber,
    };

    io.to(`user_${user.id}`).emit("offers:clear", {
      requestId: result.request.id,
    });
    io.to(`user_${user.id}`).emit("ride:started", navigationData);
    io.to(`mechanic_${result.mechanic.id}`).emit(
      "ride:started",
      navigationData,
    );
    emitMechanicsUpdate();

    return res.json({
      message: "Offer accepted",
      request: { id: result.request.id },
      navigationData,
    });
  } catch (err) {
    console.error("Accept offer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateAssignedRequestStatus = async (
  req: AuthRequest,
  res: Response,
  nextStatus: RequestStatus,
  allowedCurrentStatuses: RequestStatus[],
  emittedEvent: string,
  successMessage: string,
) => {
  try {
    if (!ensureRole(req.user, [UserRole.HELPER], res)) {
      return;
    }

    const { requestId } = req.body as { requestId?: number };
    const helper = req.user as User;

    if (!requestId) {
      return res.status(400).json({ message: "requestId is required" });
    }

    const requestRepo = AppDataSource.getRepository(JobRequest);
    const request = await requestRepo.findOne({
      where: { id: requestId },
      relations: ["user", "helper"],
    });

    if (!request || !allowedCurrentStatuses.includes(request.status)) {
      return res.status(400).json({ message: "Request not active" });
    }

    if (request.helper?.id !== helper.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    request.status = nextStatus;
    await requestRepo.save(request);

    io.to(`user_${request.user.id}`).emit(emittedEvent, { requestId });
    return res.json({ message: successMessage });
  } catch (err) {
    console.error("Request status update error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const helperArrived = async (req: AuthRequest, res: Response) =>
  updateAssignedRequestStatus(
    req,
    res,
    "arrived",
    ["accepted"],
    "helper:arrived",
    "Arrived",
  );

export const helperStartWork = async (req: AuthRequest, res: Response) =>
  updateAssignedRequestStatus(
    req,
    res,
    "working",
    ["arrived"],
    "helper:working",
    "Working",
  );

export const helperWorkDone = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureRole(req.user, [UserRole.HELPER], res)) {
      return;
    }

    const { requestId, finalPrice } = req.body as {
      requestId?: number;
      finalPrice?: number;
    };
    const helperUser = req.user as User;
    const totalAmount = Math.round(Number(finalPrice));

    if (!requestId || !Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid final price" });
    }

    const result = await AppDataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(JobRequest);
      const userRepo = manager.getRepository(User);
      const settingRepo = manager.getRepository(AppSetting);

      const request = await requestRepo
        .createQueryBuilder("request")
        .where("request.id = :requestId", { requestId })
        .setLock("pessimistic_write")
        .getOne();

      if (!request || request.status !== "working") {
        return {
          error: {
            status: 400,
            message: "Request not active or already completed",
          },
        };
      }

      const requestWithRelations = await requestRepo.findOne({
        where: { id: request.id },
        relations: ["user", "helper"],
      });

      if (!requestWithRelations) {
        return { error: { status: 404, message: "Request not found" } };
      }

      if (requestWithRelations.helper?.id !== helperUser.id) {
        return {
          error: {
            status: 403,
            message: "You are not assigned to this request",
          },
        };
      }

      const helperProfile = await userRepo.findOne({
        where: { id: helperUser.id },
        lock: { mode: "pessimistic_write" },
      });

      if (!helperProfile) {
        return { error: { status: 404, message: "Helper profile not found" } };
      }

      const commissionSetting = await settingRepo.findOneBy({
        key: "commission_percent",
      });
      const commissionPercent = Number(commissionSetting?.value ?? 10);
      const commissionAmount = Number(
        ((totalAmount * commissionPercent) / 100).toFixed(2),
      );

      request.status = "completed";
      request.finalPrice = totalAmount;
      helperProfile.totalEarnings = Number(
        ((Number(helperProfile.totalEarnings) || 0) + totalAmount).toFixed(2),
      );
      helperProfile.availableBalance = Number(
        (
          (Number(helperProfile.availableBalance) || 0) - commissionAmount
        ).toFixed(2),
      );
      helperProfile.isBusy = false;

      await requestRepo.save(request);
      await userRepo.save(helperProfile);

      return {
        request: requestWithRelations,
        helperProfile,
        commissionAmount,
        totalAmount,
      };
    });

    if (hasError(result)) {
      return res
        .status(result.error.status)
        .json({ message: result.error.message });
    }

    const memoryMechanic = onlineMechanics.get(result.helperProfile.id);
    if (memoryMechanic) {
      memoryMechanic.isBusy = false;
      memoryMechanic.availableBalance = result.helperProfile.availableBalance;
    }

    io.to(`user_${result.request.user.id}`).emit("helper:completed", {
      requestId,
      finalPrice: result.totalAmount,
    });
    io.to(`mechanic_${result.helperProfile.id}`).emit("stats:update", {
      earnings: result.helperProfile.totalEarnings,
      availableBalance: result.helperProfile.availableBalance,
      rating: result.helperProfile.rating,
      count: result.helperProfile.ratingCount,
      commissionSubtracted: result.commissionAmount,
    });
    emitMechanicsUpdate();

    return res.json({
      message: "Job completed and commission deducted",
      data: {
        totalCollected: result.totalAmount,
        commissionDeducted: result.commissionAmount,
        newWalletBalance: result.helperProfile.availableBalance,
      },
    });
  } catch (err) {
    console.error("Helper work done error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const cancelRide = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureRole(req.user, [UserRole.USER, UserRole.HELPER], res)) {
      return;
    }

    const { requestId } = req.body as { requestId?: number };
    const actor = req.user as User;

    if (!requestId) {
      return res.status(400).json({ message: "requestId is required" });
    }

    const result = await AppDataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(JobRequest);
      const userRepo = manager.getRepository(User);

      const request = await requestRepo
        .createQueryBuilder("request")
        .where("request.id = :requestId", { requestId })
        .setLock("pessimistic_write")
        .getOne();

      if (!request || !ACTIVE_REQUEST_STATUSES.includes(request.status)) {
        return { error: { status: 400, message: "Request not active" } };
      }

      const requestWithRelations = await requestRepo.findOne({
        where: { id: request.id },
        relations: ["user", "helper"],
      });

      if (!requestWithRelations) {
        return { error: { status: 404, message: "Request not found" } };
      }

      const isUser = requestWithRelations.user.id === actor.id;
      const isHelper = requestWithRelations.helper?.id === actor.id;

      if (!isUser && !isHelper) {
        return { error: { status: 403, message: "Forbidden" } };
      }

      request.status = "cancelled";
      await requestRepo.save(request);

      if (requestWithRelations.helper) {
        const helperProfile = await userRepo.findOne({
          where: { id: requestWithRelations.helper.id },
          lock: { mode: "pessimistic_write" },
        });

        if (helperProfile) {
          helperProfile.isBusy = false;
          await userRepo.save(helperProfile);
        }
      }

      return {
        request: requestWithRelations,
        cancelledByRole: isUser ? "user" : "helper",
      };
    });

    if (hasError(result)) {
      return res
        .status(result.error.status)
        .json({ message: result.error.message });
    }

    if (result.request.helper) {
      const memoryMechanic = onlineMechanics.get(result.request.helper.id);
      if (memoryMechanic) {
        memoryMechanic.isBusy = false;
      }
    }

    const cancelPayload = {
      requestId: result.request.id,
      cancelledByRole: result.cancelledByRole,
    };

    io.emit("request:unavailable", { requestId: result.request.id });
    io.to(`user_${result.request.user.id}`).emit(
      "ride:cancelled",
      cancelPayload,
    );

    if (result.request.helper) {
      io.to(`mechanic_${result.request.helper.id}`).emit(
        "ride:cancelled",
        cancelPayload,
      );
    }

    emitMechanicsUpdate();

    return res.json({
      message: "Ride cancelled successfully",
      cancelledByRole: result.cancelledByRole,
    });
  } catch (err) {
    console.error("Cancel ride error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const userRateHelper = async (req: AuthRequest, res: Response) => {
  try {
    if (!ensureRole(req.user, [UserRole.USER], res)) {
      return;
    }

    const { requestId, rating } = req.body as {
      requestId?: number;
      rating?: number;
    };
    const user = req.user as User;
    const parsedRating = Math.round(Number(rating));

    if (!requestId || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Invalid rating payload" });
    }

    const result = await AppDataSource.transaction(async (manager) => {
      const requestRepo = manager.getRepository(JobRequest);
      const userRepo = manager.getRepository(User);

      const request = await requestRepo
        .createQueryBuilder("request")
        .where("request.id = :requestId", { requestId })
        .setLock("pessimistic_write")
        .getOne();

      if (!request) {
        return { error: { status: 404, message: "Request not found" } };
      }

      const requestWithRelations = await requestRepo.findOne({
        where: { id: request.id },
        relations: ["helper", "user"],
      });

      if (!requestWithRelations) {
        return { error: { status: 404, message: "Request not found" } };
      }

      if (requestWithRelations.user.id !== user.id) {
        return { error: { status: 403, message: "Forbidden" } };
      }

      if (request.status !== "completed") {
        return {
          error: { status: 400, message: "Only completed rides can be rated" },
        };
      }

      if (request.rating) {
        return { error: { status: 400, message: "Already rated" } };
      }

      request.rating = parsedRating;
      await requestRepo.save(request);

      if (!requestWithRelations.helper) {
        return { request: requestWithRelations };
      }

      const helper = await userRepo.findOne({
        where: { id: requestWithRelations.helper.id },
        lock: { mode: "pessimistic_write" },
      });

      if (!helper) {
        return { request: requestWithRelations };
      }

      const currentRating = Number(helper.rating) || 0;
      const currentCount = Number(helper.ratingCount) || 0;
      const newCount = currentCount + 1;

      helper.rating = Number(
        ((currentRating * currentCount + parsedRating) / newCount).toFixed(2),
      );
      helper.ratingCount = newCount;
      await userRepo.save(helper);

      return { request: requestWithRelations, helper };
    });

    if (hasError(result)) {
      return res
        .status(result.error.status)
        .json({ message: result.error.message });
    }

    if (result.helper) {
      io.to(`mechanic_${result.helper.id}`).emit("stats:update", {
        rating: result.helper.rating,
        earnings: result.helper.totalEarnings,
        count: result.helper.ratingCount,
        availableBalance: result.helper.availableBalance,
      });
    }

    return res.json({ message: "Rating saved" });
  } catch (err) {
    console.error("User rate helper error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
