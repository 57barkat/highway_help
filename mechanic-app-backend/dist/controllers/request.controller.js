"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRateHelper = exports.cancelRide = exports.helperWorkDone = exports.helperStartWork = exports.helperArrived = exports.acceptOffer = exports.makeOffer = exports.createRequest = void 0;
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
const Request_1 = require("../entities/Request");
const Offer_1 = require("../entities/Offer");
const index_1 = require("../index");
const geolib_1 = require("geolib");
const typeorm_1 = require("typeorm");
const AppSetting_1 = require("../entities/AppSetting");
const ACTIVE_STATUSES = ["pending", "accepted", "arrived", "working"];
const PROBLEM_RATES = {
    "Flat Tire": { base: 150, perKm: 40 },
    "Battery Jump": { base: 100, perKm: 30 },
    "Engine Issue": { base: 300, perKm: 60 },
    "Fuel Delivery": { base: 80, perKm: 30 },
    "Tow Required": { base: 500, perKm: 100 },
    "Locked Out": { base: 120, perKm: 40 },
    "General Help": { base: 100, perKm: 25 },
};
const createRequest = async (req, res) => {
    try {
        const { problemType, lat, lng, description, areaName, radius } = req.body;
        const searchRadius = radius || 5;
        const user = req.user;
        if (!lat || !lng || !problemType || !description) {
            return res.status(400).json({ message: "Missing fields" });
        }
        const requestRepo = db_1.AppDataSource.getRepository(Request_1.Request);
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const offerRepo = db_1.AppDataSource.getRepository(Offer_1.Offer);
        // --- FIX: Use QueryBuilder to avoid "FOR UPDATE" join error ---
        await requestRepo
            .createQueryBuilder()
            .update(Request_1.Request)
            .set({ status: "cancelled" })
            .where("userId = :id", { id: user.id })
            .andWhere("status IN (:...statuses)", {
            statuses: ["pending", "accepted"],
        })
            .execute();
        index_1.io.to(`user_${user.id}`).emit("request:cleared_previous");
        // Database se online helpers nikalein (Price calculation ke liye)
        const onlineHelpers = await userRepo.find({
            where: {
                role: User_1.UserRole.HELPER,
                isOnline: true,
                isBusy: false,
                lat: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
                lng: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()),
            },
        });
        // Price Calculation Logic
        const config = PROBLEM_RATES[problemType] || { base: 100, perKm: 50 };
        let suggestedPrice = config.base;
        if (onlineHelpers.length > 0) {
            const distances = onlineHelpers.map((h) => (0, geolib_1.getDistance)({ latitude: lat, longitude: lng }, { latitude: h.lat, longitude: h.lng }));
            const nearestDistanceKm = Math.min(...distances) / 1000;
            suggestedPrice += nearestDistanceKm * config.perKm;
        }
        suggestedPrice = Math.round(suggestedPrice);
        // Naya Request create karein
        const newRequest = requestRepo.create({
            user,
            problemType,
            description,
            areaName,
            lat,
            lng,
            status: "pending",
            suggestedPrice,
        });
        await requestRepo.save(newRequest);
        // --- RADIUS FILTERING LOGIC ---
        let foundNearby = false;
        for (const mechanic of index_1.onlineMechanics.values()) {
            if (mechanic.isBusy || !mechanic.lat || !mechanic.lng)
                continue;
            const dist = (0, geolib_1.getDistance)({ latitude: lat, longitude: lng }, { latitude: mechanic.lat, longitude: mechanic.lng }) / 1000;
            if (dist <= searchRadius) {
                foundNearby = true;
                index_1.io.to(mechanic.socketId).emit("request:new", {
                    requestId: newRequest.id,
                    userId: user.id,
                    userName: user.name,
                    problemType,
                    description,
                    areaName,
                    lat,
                    lng,
                    suggestedPrice,
                    distance: dist.toFixed(1),
                });
            }
        }
        // Timeout logic (5 mins)
        setTimeout(async () => {
            try {
                const checkReq = await requestRepo.findOne({
                    where: { id: newRequest.id },
                    relations: ["user", "helper"],
                });
                if (checkReq && checkReq.status === "pending" && !checkReq.helper) {
                    checkReq.status = "cancelled";
                    await requestRepo.save(checkReq);
                    await offerRepo.delete({ request: { id: checkReq.id } });
                    index_1.io.emit("request:unavailable", { requestId: checkReq.id });
                    index_1.io.to(`user_${checkReq.user.id}`).emit("ride:cancelled", {
                        requestId: checkReq.id,
                        reason: "timeout",
                    });
                }
            }
            catch (timeoutErr) {
                console.error("Error in request timeout check:", timeoutErr);
            }
        }, 5 * 60 * 1000);
        return res.status(201).json({
            message: foundNearby
                ? "Request created"
                : "Request created but no one nearby",
            noNearbyFound: !foundNearby,
            currentRadius: searchRadius,
            request: {
                id: newRequest.id,
                userId: user.id,
                userName: user.name,
                problemType,
                description,
                areaName,
                lat,
                lng,
                suggestedPrice,
                status: newRequest.status,
            },
        });
    }
    catch (err) {
        console.error("Create Request Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.createRequest = createRequest;
const makeOffer = async (req, res) => {
    try {
        const { requestId, offeredPrice } = req.body;
        const mechanic = req.user;
        if (!requestId || !offeredPrice) {
            return res.status(400).json({ message: "Missing fields" });
        }
        const requestRepo = db_1.AppDataSource.getRepository(Request_1.Request);
        const offerRepo = db_1.AppDataSource.getRepository(Offer_1.Offer);
        const request = await requestRepo.findOne({
            where: { id: requestId },
            relations: ["user"],
        });
        if (!request || !ACTIVE_STATUSES.includes(request.status)) {
            return res.status(400).json({ message: "Request not active" });
        }
        if (request.helper) {
            return res.status(400).json({ message: "Request already accepted" });
        }
        // --- NEW COOLDOWN LOGIC START ---
        const lastOffer = await offerRepo.findOne({
            where: { request: { id: requestId }, mechanic: { id: mechanic.id } },
            order: { createdAt: "DESC" },
        });
        if (lastOffer) {
            const now = new Date();
            const lastTime = new Date(lastOffer.createdAt);
            const diffInSeconds = Math.floor((now.getTime() - lastTime.getTime()) / 1000);
            if (diffInSeconds < 60) {
                return res.status(429).json({
                    message: `Please wait ${60 - diffInSeconds} seconds before updating your offer.`,
                });
            }
        }
        // --- NEW COOLDOWN LOGIC END ---
        const rawDistance = mechanic.lat && mechanic.lng
            ? (0, geolib_1.getDistance)({ latitude: mechanic.lat, longitude: mechanic.lng }, { latitude: request.lat, longitude: request.lng }) / 1000
            : null;
        const distanceKm = rawDistance ? parseFloat(rawDistance.toFixed(2)) : null;
        const finalOfferedPrice = Math.round(offeredPrice);
        const offer = offerRepo.create({
            mechanic,
            request,
            offeredPrice: finalOfferedPrice,
        });
        await offerRepo.save(offer);
        index_1.io.to(`user_${request.user.id}`).emit("offer:new", {
            id: offer.id,
            requestId: request.id,
            offeredPrice: finalOfferedPrice,
            distanceKm,
            helper: {
                userId: mechanic.id,
                name: mechanic.name,
                lat: mechanic.lat,
                lng: mechanic.lng,
                rating: mechanic.rating || 0,
                ratingCount: mechanic.ratingCount || 0,
            },
        });
        return res.json({ message: "Offer sent", offerId: offer.id });
    }
    catch (err) {
        console.error("Make Offer Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.makeOffer = makeOffer;
const acceptOffer = async (req, res) => {
    try {
        const { offerId } = req.body;
        const user = req.user;
        const offerRepo = db_1.AppDataSource.getRepository(Offer_1.Offer);
        const requestRepo = db_1.AppDataSource.getRepository(Request_1.Request);
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const offer = await offerRepo.findOne({
            where: { id: offerId },
            relations: ["request", "request.user", "mechanic"],
        });
        if (!offer || offer.request.status !== "pending") {
            return res.status(400).json({ message: "Request no longer available" });
        }
        if (offer.request.user.id !== user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        offer.accepted = true;
        await offerRepo.save(offer);
        const request = offer.request;
        request.status = "accepted";
        request.helper = offer.mechanic;
        await requestRepo.save(request);
        // Sync Memory Map: Flag mechanic as busy so they disappear from map for others
        const mechInMemory = index_1.onlineMechanics.get(offer.mechanic.id);
        if (mechInMemory) {
            mechInMemory.isBusy = true;
        }
        await userRepo.update({ id: offer.mechanic.id }, { isBusy: true });
        await offerRepo.delete({
            request: { id: request.id },
            accepted: false,
        });
        index_1.io.emit("request:unavailable", { requestId: request.id });
        const navigationData = {
            requestId: request.id,
            userLocation: { lat: request.lat, lng: request.lng },
            helperLocation: { lat: offer.mechanic.lat, lng: offer.mechanic.lng },
            offeredPrice: Math.round(offer.offeredPrice),
            helperName: offer.mechanic.name,
        };
        index_1.io.to(`user_${user.id}`).emit("offers:clear", { requestId: request.id });
        index_1.io.to(`user_${user.id}`).emit("ride:started", navigationData);
        index_1.io.to(`mechanic_${offer.mechanic.id}`).emit("ride:started", navigationData);
        // Trigger a global update so the accepted mechanic is removed from all users' maps
        const activeList = Array.from(index_1.onlineMechanics.values()).filter((m) => !m.isBusy);
        index_1.io.emit("mechanics:update", activeList);
        return res.json({
            message: "Offer accepted",
            request: { id: request.id },
            navigationData: navigationData,
        });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.acceptOffer = acceptOffer;
const helperArrived = async (req, res) => {
    try {
        const { requestId } = req.body;
        const helper = req.user;
        const repo = db_1.AppDataSource.getRepository(Request_1.Request);
        const request = await repo.findOne({
            where: { id: requestId },
            relations: ["user", "helper"],
        });
        if (!request || !ACTIVE_STATUSES.includes(request.status)) {
            return res.status(400).json({ message: "Request not active" });
        }
        if (request.helper?.id !== helper.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        request.status = "arrived";
        await repo.save(request);
        index_1.io.to(`user_${request.user.id}`).emit("helper:arrived", { requestId });
        return res.json({ message: "Arrived" });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.helperArrived = helperArrived;
const helperStartWork = async (req, res) => {
    try {
        const { requestId } = req.body;
        const helper = req.user;
        const repo = db_1.AppDataSource.getRepository(Request_1.Request);
        const request = await repo.findOne({
            where: { id: requestId },
            relations: ["user", "helper"],
        });
        if (!request || !ACTIVE_STATUSES.includes(request.status)) {
            return res.status(400).json({ message: "Request not active" });
        }
        if (request.helper?.id !== helper.id) {
            return res.status(403).json({ message: "Forbidden" });
        }
        request.status = "working";
        await repo.save(request);
        index_1.io.to(`user_${request.user.id}`).emit("helper:working", { requestId });
        return res.json({ message: "Working" });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.helperStartWork = helperStartWork;
const helperWorkDone = async (req, res) => {
    const queryRunner = db_1.AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        const { requestId, finalPrice } = req.body;
        const helperUser = req.user;
        const totalAmount = Math.round(parseFloat(finalPrice));
        if (!requestId || isNaN(totalAmount) || totalAmount <= 0) {
            await queryRunner.rollbackTransaction();
            return res.status(400).json({ message: "Invalid final price" });
        }
        const requestRepo = queryRunner.manager.getRepository(Request_1.Request);
        const userRepo = queryRunner.manager.getRepository(User_1.User);
        const settingRepo = queryRunner.manager.getRepository(AppSetting_1.AppSetting);
        // 1. Fetch request and helper profile
        const request = await requestRepo.findOne({
            where: { id: requestId },
            relations: ["user", "helper"],
        });
        if (!request || !ACTIVE_STATUSES.includes(request.status)) {
            await queryRunner.rollbackTransaction();
            return res
                .status(400)
                .json({ message: "Request not active or already completed" });
        }
        if (request.helper?.id !== helperUser.id) {
            await queryRunner.rollbackTransaction();
            return res
                .status(403)
                .json({ message: "You are not assigned to this request" });
        }
        // 2. Calculate Commission (Fee)
        const commissionSetting = await settingRepo.findOneBy({
            key: "commission_percent",
        });
        const commissionPercent = commissionSetting?.value
            ? parseFloat(commissionSetting.value.toString())
            : 10; // Default to 10%
        const commissionAmount = parseFloat(((totalAmount * commissionPercent) / 100).toFixed(2));
        // 3. Update Request Status
        request.status = "completed";
        request.finalPrice = totalAmount;
        await requestRepo.save(request);
        // 4. Update Helper Wallet (Subtract Commission from availableBalance)
        const helperProfile = await userRepo.findOne({
            where: { id: helperUser.id },
        });
        if (!helperProfile) {
            await queryRunner.rollbackTransaction();
            return res.status(404).json({ message: "Helper profile not found" });
        }
        // Total earnings go up (what they collected in cash)
        helperProfile.totalEarnings = parseFloat(((Number(helperProfile.totalEarnings) || 0) + totalAmount).toFixed(2));
        // AVAILABLE BALANCE (Top-up wallet) goes down by the commission amount
        helperProfile.availableBalance = parseFloat(((Number(helperProfile.availableBalance) || 0) - commissionAmount).toFixed(2));
        helperProfile.isBusy = false;
        await userRepo.save(helperProfile);
        // 5. Update Memory Map (for real-time filtering)
        const mechInMemory = index_1.onlineMechanics.get(helperProfile.id);
        if (mechInMemory) {
            mechInMemory.isBusy = false;
            // We store the updated balance in memory so createRequest can check it instantly
            mechInMemory.availableBalance = helperProfile.availableBalance;
        }
        await queryRunner.commitTransaction();
        // 6. Socket Notifications
        // Tell User job is done
        index_1.io.to(`user_${request.user.id}`).emit("helper:completed", {
            requestId,
            finalPrice: totalAmount,
        });
        // Tell Helper their new wallet status
        index_1.io.to(`mechanic_${helperProfile.id}`).emit("stats:update", {
            earnings: helperProfile.totalEarnings,
            availableBalance: helperProfile.availableBalance, // This might now be negative
            rating: helperProfile.rating,
            count: helperProfile.ratingCount,
            commissionSubtracted: commissionAmount,
        });
        // Update global map
        const activeList = Array.from(index_1.onlineMechanics.values()).filter((m) => !m.isBusy && m.availableBalance >= 0);
        index_1.io.emit("mechanics:update", activeList);
        return res.json({
            message: "Job completed and commission deducted",
            data: {
                totalCollected: totalAmount,
                commissionDeducted: commissionAmount,
                newWalletBalance: helperProfile.availableBalance,
            },
        });
    }
    catch (err) {
        console.error("HelperWorkDone Error:", err);
        await queryRunner.rollbackTransaction();
        return res.status(500).json({ message: "Server error" });
    }
    finally {
        await queryRunner.release();
    }
};
exports.helperWorkDone = helperWorkDone;
const cancelRide = async (req, res) => {
    try {
        const { requestId } = req.body;
        const user = req.user;
        const requestRepo = db_1.AppDataSource.getRepository(Request_1.Request);
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const request = await requestRepo.findOne({
            where: { id: requestId },
            relations: ["user", "helper"],
        });
        if (!request || !ACTIVE_STATUSES.includes(request.status)) {
            return res.status(400).json({ message: "Request not active" });
        }
        const isUser = request.user.id === user.id;
        const isHelper = request.helper?.id === user.id;
        if (!isUser && !isHelper) {
            return res.status(403).json({ message: "Forbidden" });
        }
        // Identify who initiated the cancellation
        const cancelledByRole = isUser ? "user" : "helper";
        request.status = "cancelled";
        await requestRepo.save(request);
        // Global emit to clear it from other mechanics' lists
        index_1.io.emit("request:unavailable", { requestId: request.id });
        if (request.helper) {
            await userRepo.update({ id: request.helper.id }, { isBusy: false });
            const mechInMemory = index_1.onlineMechanics.get(request.helper.id);
            if (mechInMemory) {
                mechInMemory.isBusy = false;
            }
        }
        // Send the cancellation data including the role
        const cancelPayload = {
            requestId: request.id,
            cancelledByRole: cancelledByRole,
        };
        // Notify the User
        index_1.io.to(`user_${request.user.id}`).emit("ride:cancelled", cancelPayload);
        // Notify the Mechanic/Helper
        if (request.helper) {
            index_1.io.to(`mechanic_${request.helper.id}`).emit("ride:cancelled", cancelPayload);
        }
        // Update the live map for everyone
        const activeList = Array.from(index_1.onlineMechanics.values()).filter((m) => !m.isBusy);
        index_1.io.emit("mechanics:update", activeList);
        return res.json({
            message: "Ride cancelled successfully",
            cancelledByRole,
        });
    }
    catch (err) {
        console.error("Backend Cancel Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.cancelRide = cancelRide;
const userRateHelper = async (req, res) => {
    try {
        const { requestId, rating } = req.body;
        const user = req.user;
        const requestRepo = db_1.AppDataSource.getRepository(Request_1.Request);
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const request = await requestRepo.findOne({
            where: { id: requestId },
            relations: ["helper", "user"],
        });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        if (request.rating) {
            return res.status(400).json({ message: "Already rated" });
        }
        request.rating = Math.round(Number(rating));
        await requestRepo.save(request);
        if (request.helper) {
            const helper = request.helper;
            const currentRating = Number(helper.rating) || 0;
            const currentCount = Number(helper.ratingCount) || 0;
            const newCount = currentCount + 1;
            const newAverage = (currentRating * currentCount + Number(rating)) / newCount;
            helper.rating = parseFloat(newAverage.toFixed(2));
            helper.ratingCount = newCount;
            await userRepo.save(helper);
            index_1.io.to(`mechanic_${helper.id}`).emit("stats:update", {
                rating: helper.rating,
                earnings: helper.totalEarnings,
                count: helper.ratingCount,
                commission: helper.pendingBalance,
            });
        }
        return res.json({ message: "Rating saved" });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.userRateHelper = userRateHelper;
