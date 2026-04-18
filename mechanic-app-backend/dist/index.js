"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineMechanics = exports.io = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const typeorm_1 = require("typeorm");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const request_routes_1 = __importDefault(require("./routes/request.routes"));
const User_1 = require("./entities/User");
const Request_1 = require("./entities/Request");
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const db_1 = require("./config/db");
const auth_util_1 = require("./utils/auth.util");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
exports.io = new socket_io_1.Server(server, {
    path: "/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: 25000,
    pingTimeout: 20000,
});
const ACTIVE_STATUSES = ["pending", "accepted", "arrived", "working"];
const MAX_DISTANCE_KM = 5;
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
exports.onlineMechanics = new Map();
let lastEmitTime = 0;
const EMIT_INTERVAL = 5000;
let emitTimeout = null;
const performEmit = () => {
    const list = Array.from(exports.onlineMechanics.values()).filter((m) => m.lat !== null && m.lng !== null && !m.isBusy && m.availableBalance >= 0);
    exports.io.emit("mechanics:update", list);
    lastEmitTime = Date.now();
    if (emitTimeout) {
        clearTimeout(emitTimeout);
        emitTimeout = null;
    }
};
const emitMechanicsThrottled = () => {
    const now = Date.now();
    if (now - lastEmitTime >= EMIT_INTERVAL) {
        performEmit();
    }
    else if (!emitTimeout) {
        const delay = EMIT_INTERVAL - (now - lastEmitTime);
        emitTimeout = setTimeout(performEmit, delay);
    }
};
const startServer = async () => {
    try {
        await db_1.AppDataSource.initialize();
        console.log("✅ [DB] Database connected");
        app.use((0, cors_1.default)());
        app.use(express_1.default.json({
            verify: (req, res, buf) => {
                req.rawBody = buf;
            },
        }));
        app.use(express_1.default.urlencoded({ extended: true }));
        app.use("/api/auth", auth_routes_1.default);
        app.use("/api/request", request_routes_1.default);
        app.use("/api/admin", require("./routes/admin.routes").default);
        app.use("/api/payments", payment_routes_1.default);
        exports.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth?.token;
                if (!token)
                    return next(new Error("No token"));
                const payload = (0, auth_util_1.verifyToken)(token);
                if (payload.type !== "access") {
                    return next(new Error("Invalid access token"));
                }
                socket.userId = payload.id;
                next();
            }
            catch (err) {
                next(new Error("Auth error"));
            }
        });
        exports.io.on("connection", async (socket) => {
            const userId = socket.userId;
            const userRepo = db_1.AppDataSource.getRepository(User_1.User);
            const requestRepo = db_1.AppDataSource.getRepository(Request_1.Request);
            // --- CRITICAL FIX: IMMEDIATE STATS PUSH ON CONNECTION ---
            const dbUser = await userRepo.findOneBy({ id: userId });
            if (dbUser) {
                socket.emit("stats:update", {
                    rating: dbUser.rating || 0,
                    earnings: dbUser.totalEarnings || 0,
                    count: dbUser.ratingCount || 0,
                    availableBalance: dbUser.availableBalance || 0,
                });
            }
            const userRooms = Array.from(socket.rooms);
            userRooms.forEach((room) => {
                if (room.startsWith("request_"))
                    socket.leave(room);
            });
            socket.join(`user_${userId}`);
            socket.join(`mechanic_${userId}`);
            const activeReq = await requestRepo.findOne({
                where: [
                    { user: { id: userId }, status: (0, typeorm_1.In)(ACTIVE_STATUSES) },
                    {
                        helper: { id: userId },
                        status: (0, typeorm_1.In)(["accepted", "arrived", "working"]),
                    },
                ],
                relations: ["helper", "user"],
            });
            if (activeReq) {
                socket.join(`request_${activeReq.id}`);
            }
            socket.on("ride:location_update", ({ requestId, lat, lng }) => {
                if (!requestId ||
                    typeof lat !== "number" ||
                    typeof lng !== "number" ||
                    Number.isNaN(lat) ||
                    Number.isNaN(lng)) {
                    return;
                }
                socket.to(`request_${requestId}`).emit("ride:peer_location", {
                    senderId: userId,
                    lat,
                    lng,
                });
            });
            socket.emit("ride:sync", {
                isOnline: dbUser?.isOnline || false,
                requestId: activeReq?.id || null,
                status: activeReq?.status || null,
                hideOffers: activeReq && activeReq.status !== "pending",
            });
            if (dbUser?.role === User_1.UserRole.HELPER &&
                dbUser.isOnline &&
                dbUser.availableBalance >= 0) {
                exports.onlineMechanics.set(userId, {
                    socketId: socket.id,
                    userId,
                    lat: dbUser.lat || null,
                    lng: dbUser.lng || null,
                    isBusy: dbUser.isBusy || false,
                    availableBalance: dbUser.availableBalance,
                });
                performEmit();
            }
            socket.on("mechanic:online", async () => {
                const helperProfile = await userRepo.findOneBy({ id: userId });
                if (helperProfile) {
                    // Send stats regardless of balance so UI is updated
                    socket.emit("stats:update", {
                        rating: helperProfile.rating,
                        earnings: helperProfile.totalEarnings,
                        count: helperProfile.ratingCount,
                        availableBalance: helperProfile.availableBalance,
                    });
                    if (helperProfile.availableBalance < 0) {
                        socket.emit("wallet:low_balance", {
                            message: `Please top up your account. Current balance: Rs. ${helperProfile.availableBalance}`,
                            balance: helperProfile.availableBalance,
                        });
                        return;
                    }
                    helperProfile.isOnline = true;
                    helperProfile.isBusy = false;
                    await userRepo.save(helperProfile);
                    exports.onlineMechanics.set(userId, {
                        socketId: socket.id,
                        userId,
                        lat: helperProfile.lat || null,
                        lng: helperProfile.lng || null,
                        isBusy: false,
                        availableBalance: helperProfile.availableBalance,
                    });
                    const pendingRequests = await requestRepo.find({
                        where: { status: "pending", helper: (0, typeorm_1.IsNull)() },
                        relations: ["user"],
                        order: { createdAt: "DESC" },
                        take: 15,
                    });
                    pendingRequests.forEach((req) => {
                        if (req.user.id !== userId &&
                            req.lat &&
                            req.lng &&
                            helperProfile.lat &&
                            helperProfile.lng) {
                            const distance = getDistance(helperProfile.lat, helperProfile.lng, req.lat, req.lng);
                            if (distance <= MAX_DISTANCE_KM) {
                                socket.emit("request:new", {
                                    requestId: req.id,
                                    userId: req.user.id,
                                    userName: req.user.name,
                                    problemType: req.problemType,
                                    description: req.description,
                                    areaName: req.areaName,
                                    lat: req.lat,
                                    lng: req.lng,
                                    suggestedPrice: req.suggestedPrice,
                                    status: req.status || "pending",
                                    distance: distance.toFixed(1),
                                });
                            }
                        }
                    });
                }
                performEmit();
            });
            socket.on("mechanic:offline", async () => {
                const helperProfile = await userRepo.findOneBy({ id: userId });
                if (helperProfile) {
                    helperProfile.isOnline = false;
                    helperProfile.isBusy = false;
                    await userRepo.save(helperProfile);
                }
                exports.onlineMechanics.delete(userId);
                performEmit();
            });
            socket.on("mechanic:location", async ({ lat, lng }) => {
                if (typeof lat !== "number" ||
                    typeof lng !== "number" ||
                    Number.isNaN(lat) ||
                    Number.isNaN(lng)) {
                    return;
                }
                let mech = exports.onlineMechanics.get(userId);
                if (!mech) {
                    const dbUser = await userRepo.findOneBy({ id: userId });
                    if (dbUser && dbUser.availableBalance >= 0) {
                        exports.onlineMechanics.set(userId, {
                            socketId: socket.id,
                            userId,
                            lat,
                            lng,
                            isBusy: dbUser?.isBusy || false,
                            availableBalance: dbUser.availableBalance,
                        });
                        mech = exports.onlineMechanics.get(userId);
                    }
                }
                if (mech) {
                    mech.lat = lat;
                    mech.lng = lng;
                    await userRepo.update({ id: userId }, { lat, lng });
                    emitMechanicsThrottled();
                }
            });
            socket.on("ride:cancel", async ({ requestId }) => {
                const request = await requestRepo.findOne({
                    where: { id: requestId },
                    relations: ["user", "helper"],
                });
                if (!request || !ACTIVE_STATUSES.includes(request.status))
                    return;
                if (request.user.id !== userId && request.helper?.id !== userId)
                    return;
                request.status = "cancelled";
                await requestRepo.save(request);
                if (request.helper) {
                    await userRepo.update({ id: request.helper.id }, { isBusy: false });
                    const mech = exports.onlineMechanics.get(request.helper.id);
                    if (mech)
                        mech.isBusy = false;
                }
                exports.io.to(`request_${requestId}`).emit("ride:cancelled", {
                    requestId,
                    cancelledBy: userId,
                });
                exports.io.emit("request:unavailable", { requestId });
                exports.io.to(`user_${request.user.id}`).emit("offers:clear");
                exports.io.in(`request_${requestId}`).socketsLeave(`request_${requestId}`);
                performEmit();
            });
            socket.on("disconnect", async () => {
                if (exports.onlineMechanics.has(userId)) {
                    exports.onlineMechanics.delete(userId);
                    await userRepo.update({ id: userId }, { isOnline: false });
                    performEmit();
                }
            });
        });
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => console.log(`🚀 [SERVER] Running on port ${PORT}`));
    }
    catch (error) {
        console.error("❌ [FATAL] Server failed to start:", error);
        process.exit(1);
    }
};
startServer();
