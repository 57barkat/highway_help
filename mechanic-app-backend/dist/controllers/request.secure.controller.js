"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRateHelper = exports.cancelRide = exports.helperWorkDone = exports.helperStartWork = exports.helperArrived = exports.acceptOffer = exports.makeOffer = exports.createRequest = void 0;
const geolib_1 = require("geolib");
const typeorm_1 = require("typeorm");
const db_1 = require("../config/db");
const Offer_1 = require("../entities/Offer");
const Request_1 = require("../entities/Request");
const AppSetting_1 = require("../entities/AppSetting");
const User_1 = require("../entities/User");
const index_1 = require("../index");
const ACTIVE_REQUEST_STATUSES = [
    "pending",
    "accepted",
    "arrived",
    "working",
];
const PROBLEM_RATES = {
    "Flat Tire": { base: 150, perKm: 40 },
    "Battery Jump": { base: 100, perKm: 30 },
    "Engine Issue": { base: 300, perKm: 60 },
    "Fuel Delivery": { base: 80, perKm: 30 },
    "Tow Required": { base: 500, perKm: 100 },
    "Locked Out": { base: 120, perKm: 40 },
    "General Help": { base: 100, perKm: 25 },
};
const getVisibleMechanics = () => Array.from(index_1.onlineMechanics.values()).filter((mechanic) => mechanic.lat !== null &&
    mechanic.lng !== null &&
    !mechanic.isBusy &&
    mechanic.availableBalance >= 0);
const emitMechanicsUpdate = () => {
    index_1.io.emit("mechanics:update", getVisibleMechanics());
};
const ensureRole = (user, allowedRoles, res) => {
    if (!user || !allowedRoles.includes(user.role)) {
        res.status(403).json({ message: "Forbidden" });
        return false;
    }
    return true;
};
const isValidCoordinate = (value) => typeof value === "number" && Number.isFinite(value);
const parseRadius = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 5;
    }
    return Math.min(Math.max(parsed, 3), 30);
};
const hasError = (value) => value.error !== undefined;
const deleteOffersForRequestIds = async (requestRepo, requestIds) => {
    if (requestIds.length === 0) {
        return;
    }
    await requestRepo.manager
        .createQueryBuilder()
        .delete()
        .from(Offer_1.Offer)
        .where(`"requestId" IN (:...requestIds)`, { requestIds })
        .execute();
};
const schedulePendingRequestTimeout = (requestId) => {
    setTimeout(async () => {
        try {
            await db_1.AppDataSource.transaction(async (manager) => {
                const requestRepo = manager.getRepository(Request_1.Request);
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
                index_1.io.emit("request:unavailable", { requestId: request.id });
                index_1.io.to(`user_${requestWithRelations.user.id}`).emit("ride:cancelled", {
                    requestId: request.id,
                    cancelledByRole: "system",
                    reason: "timeout",
                });
            });
        }
        catch (error) {
            console.error("Request timeout processing error:", error);
        }
    }, 5 * 60 * 1000);
};
const createRequest = async (req, res) => {
    try {
        if (!ensureRole(req.user, [User_1.UserRole.USER], res)) {
            return;
        }
        const { problemType, lat, lng, description, areaName, radius } = req.body;
        console.log("Create request payload:", req.body);
        const trimmedDescription = description?.trim();
        if (!problemType ||
            !trimmedDescription ||
            !isValidCoordinate(lat) ||
            !isValidCoordinate(lng)) {
            return res.status(400).json({ message: "Missing or invalid fields" });
        }
        const searchRadius = parseRadius(radius);
        const user = req.user;
        const requestLat = lat;
        const requestLng = lng;
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const onlineHelpers = await userRepo.find({
            where: {
                role: User_1.UserRole.HELPER,
                isOnline: true,
                isBusy: false,
                lat: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
                lng: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
            },
        });
        const pricing = PROBLEM_RATES[problemType] || { base: 100, perKm: 50 };
        let suggestedPrice = pricing.base;
        if (onlineHelpers.length > 0) {
            const distances = onlineHelpers.map((helper) => (0, geolib_1.getDistance)({ lat: requestLat, lng: requestLng }, { lat: helper.lat, lng: helper.lng }));
            suggestedPrice += (Math.min(...distances) / 1000) * pricing.perKm;
        }
        const request = await db_1.AppDataSource.transaction(async (manager) => {
            const requestRepo = manager.getRepository(Request_1.Request);
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
                    .update(Request_1.Request)
                    .set({ status: "cancelled" })
                    .where("id IN (:...existingIds)", { existingIds })
                    .execute();
                await deleteOffersForRequestIds(requestRepo, existingIds);
                existingRequests.forEach((item) => {
                    index_1.io.emit("request:unavailable", { requestId: item.id });
                    index_1.io.to(`user_${user.id}`).emit("ride:cancelled", {
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
            const distanceKm = (0, geolib_1.getDistance)({ lat: requestLat, lng: requestLng }, { lat: mechanic.lat, lng: mechanic.lng }) / 1000;
            if (distanceKm > searchRadius) {
                continue;
            }
            foundNearby = true;
            index_1.io.to(mechanic.socketId).emit("request:new", {
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
    }
    catch (err) {
        console.error("Create request error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.createRequest = createRequest;
const makeOffer = async (req, res) => {
    try {
        if (!ensureRole(req.user, [User_1.UserRole.HELPER], res)) {
            return;
        }
        const { requestId, offeredPrice } = req.body;
        const mechanic = req.user;
        const parsedPrice = Number(offeredPrice);
        if (!requestId || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ message: "Missing or invalid fields" });
        }
        if (mechanic.availableBalance < 0) {
            return res.status(403).json({ message: "Top up wallet before offering" });
        }
        const result = await db_1.AppDataSource.transaction(async (manager) => {
            const requestRepo = manager.getRepository(Request_1.Request);
            const offerRepo = manager.getRepository(Offer_1.Offer);
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
                const diffInSeconds = Math.floor((Date.now() - new Date(lastOffer.createdAt).getTime()) / 1000);
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
        const rawDistance = mechanic.lat !== null && mechanic.lng !== null
            ? (0, geolib_1.getDistance)({ lat: mechanic.lat, lng: mechanic.lng }, { lat: result.request.lat, lng: result.request.lng }) / 1000
            : null;
        index_1.io.to(`user_${result.request.user.id}`).emit("offer:new", {
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
    }
    catch (err) {
        console.error("Make offer error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.makeOffer = makeOffer;
const acceptOffer = async (req, res) => {
    try {
        if (!ensureRole(req.user, [User_1.UserRole.USER], res)) {
            return;
        }
        const { offerId } = req.body;
        const user = req.user;
        if (!offerId) {
            return res.status(400).json({ message: "offerId is required" });
        }
        const result = await db_1.AppDataSource.transaction(async (manager) => {
            const offerRepo = manager.getRepository(Offer_1.Offer);
            const requestRepo = manager.getRepository(Request_1.Request);
            const userRepo = manager.getRepository(User_1.User);
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
            if (!helperProfile ||
                helperProfile.isBusy ||
                helperProfile.availableBalance < 0) {
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
        const memoryMechanic = index_1.onlineMechanics.get(result.mechanic.id);
        if (memoryMechanic) {
            memoryMechanic.isBusy = true;
        }
        index_1.io.emit("request:unavailable", { requestId: result.request.id });
        const navigationData = {
            requestId: result.request.id,
            userLocation: { lat: result.request.lat, lng: result.request.lng },
            helperLocation: { lat: result.mechanic.lat, lng: result.mechanic.lng },
            offeredPrice: Math.round(result.offer.offeredPrice),
            helperName: result.mechanic.name,
            helperPhoneNumber: result.mechanic.phoneNumber,
        };
        index_1.io.to(`user_${user.id}`).emit("offers:clear", {
            requestId: result.request.id,
        });
        index_1.io.to(`user_${user.id}`).emit("ride:started", navigationData);
        index_1.io.to(`mechanic_${result.mechanic.id}`).emit("ride:started", navigationData);
        emitMechanicsUpdate();
        return res.json({
            message: "Offer accepted",
            request: { id: result.request.id },
            navigationData,
        });
    }
    catch (err) {
        console.error("Accept offer error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.acceptOffer = acceptOffer;
const updateAssignedRequestStatus = async (req, res, nextStatus, allowedCurrentStatuses, emittedEvent, successMessage) => {
    try {
        if (!ensureRole(req.user, [User_1.UserRole.HELPER], res)) {
            return;
        }
        const { requestId } = req.body;
        const helper = req.user;
        if (!requestId) {
            return res.status(400).json({ message: "requestId is required" });
        }
        const requestRepo = db_1.AppDataSource.getRepository(Request_1.Request);
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
        index_1.io.to(`user_${request.user.id}`).emit(emittedEvent, { requestId });
        return res.json({ message: successMessage });
    }
    catch (err) {
        console.error("Request status update error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
const helperArrived = async (req, res) => updateAssignedRequestStatus(req, res, "arrived", ["accepted"], "helper:arrived", "Arrived");
exports.helperArrived = helperArrived;
const helperStartWork = async (req, res) => updateAssignedRequestStatus(req, res, "working", ["arrived"], "helper:working", "Working");
exports.helperStartWork = helperStartWork;
const helperWorkDone = async (req, res) => {
    try {
        if (!ensureRole(req.user, [User_1.UserRole.HELPER], res)) {
            return;
        }
        const { requestId, finalPrice } = req.body;
        const helperUser = req.user;
        const totalAmount = Math.round(Number(finalPrice));
        if (!requestId || !Number.isFinite(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({ message: "Invalid final price" });
        }
        const result = await db_1.AppDataSource.transaction(async (manager) => {
            const requestRepo = manager.getRepository(Request_1.Request);
            const userRepo = manager.getRepository(User_1.User);
            const settingRepo = manager.getRepository(AppSetting_1.AppSetting);
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
            const commissionAmount = Number(((totalAmount * commissionPercent) / 100).toFixed(2));
            request.status = "completed";
            request.finalPrice = totalAmount;
            helperProfile.totalEarnings = Number(((Number(helperProfile.totalEarnings) || 0) + totalAmount).toFixed(2));
            helperProfile.availableBalance = Number(((Number(helperProfile.availableBalance) || 0) - commissionAmount).toFixed(2));
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
        const memoryMechanic = index_1.onlineMechanics.get(result.helperProfile.id);
        if (memoryMechanic) {
            memoryMechanic.isBusy = false;
            memoryMechanic.availableBalance = result.helperProfile.availableBalance;
        }
        index_1.io.to(`user_${result.request.user.id}`).emit("helper:completed", {
            requestId,
            finalPrice: result.totalAmount,
        });
        index_1.io.to(`mechanic_${result.helperProfile.id}`).emit("stats:update", {
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
    }
    catch (err) {
        console.error("Helper work done error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.helperWorkDone = helperWorkDone;
const cancelRide = async (req, res) => {
    try {
        if (!ensureRole(req.user, [User_1.UserRole.USER, User_1.UserRole.HELPER], res)) {
            return;
        }
        const { requestId } = req.body;
        const actor = req.user;
        if (!requestId) {
            return res.status(400).json({ message: "requestId is required" });
        }
        const result = await db_1.AppDataSource.transaction(async (manager) => {
            const requestRepo = manager.getRepository(Request_1.Request);
            const userRepo = manager.getRepository(User_1.User);
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
            const memoryMechanic = index_1.onlineMechanics.get(result.request.helper.id);
            if (memoryMechanic) {
                memoryMechanic.isBusy = false;
            }
        }
        const cancelPayload = {
            requestId: result.request.id,
            cancelledByRole: result.cancelledByRole,
        };
        index_1.io.emit("request:unavailable", { requestId: result.request.id });
        index_1.io.to(`user_${result.request.user.id}`).emit("ride:cancelled", cancelPayload);
        if (result.request.helper) {
            index_1.io.to(`mechanic_${result.request.helper.id}`).emit("ride:cancelled", cancelPayload);
        }
        emitMechanicsUpdate();
        return res.json({
            message: "Ride cancelled successfully",
            cancelledByRole: result.cancelledByRole,
        });
    }
    catch (err) {
        console.error("Cancel ride error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.cancelRide = cancelRide;
const userRateHelper = async (req, res) => {
    try {
        if (!ensureRole(req.user, [User_1.UserRole.USER], res)) {
            return;
        }
        const { requestId, rating } = req.body;
        const user = req.user;
        const parsedRating = Math.round(Number(rating));
        if (!requestId || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ message: "Invalid rating payload" });
        }
        const result = await db_1.AppDataSource.transaction(async (manager) => {
            const requestRepo = manager.getRepository(Request_1.Request);
            const userRepo = manager.getRepository(User_1.User);
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
            helper.rating = Number(((currentRating * currentCount + parsedRating) / newCount).toFixed(2));
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
            index_1.io.to(`mechanic_${result.helper.id}`).emit("stats:update", {
                rating: result.helper.rating,
                earnings: result.helper.totalEarnings,
                count: result.helper.ratingCount,
                availableBalance: result.helper.availableBalance,
            });
        }
        return res.json({ message: "Rating saved" });
    }
    catch (err) {
        console.error("User rate helper error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.userRateHelper = userRateHelper;
