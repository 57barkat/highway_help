import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { In, IsNull } from "typeorm";
import authRoutes from "./routes/auth.routes";
import requestRoutes from "./routes/request.routes";
import { User, UserRole } from "./entities/User";
import { Request as JobRequest } from "./entities/Request";
import paymentRoutes from "./routes/payment.routes";
import { AppDataSource } from "./config/db";
import { verifyToken } from "./utils/auth.util";

dotenv.config();

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  path: "/socket.io",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingInterval: 25000,
  pingTimeout: 20000,
});

const ACTIVE_STATUSES = ["pending", "accepted", "arrived", "working"];
const MAX_DISTANCE_KM = 5;
const socketLog = (label: string, payload?: Record<string, unknown>) => {
  console.log(
    `[socket] ${new Date().toISOString()} ${label}`,
    payload ? JSON.stringify(payload) : "",
  );
};

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface OnlineMechanic {
  socketId: string;
  userId: number;
  lat: number | null;
  lng: number | null;
  isBusy: boolean;
  availableBalance: number;
}

export const onlineMechanics = new Map<number, OnlineMechanic>();

let lastEmitTime = 0;
const EMIT_INTERVAL = 5000;
let emitTimeout: NodeJS.Timeout | null = null;

const performEmit = () => {
  const list = Array.from(onlineMechanics.values()).filter(
    (m) =>
      m.lat !== null && m.lng !== null && !m.isBusy && m.availableBalance >= 0,
  );
  io.emit("mechanics:update", list);
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
  } else if (!emitTimeout) {
    const delay = EMIT_INTERVAL - (now - lastEmitTime);
    emitTimeout = setTimeout(performEmit, delay);
  }
};

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ [DB] Database connected");

    app.use(cors());
    app.use(
      express.json({
        verify: (req: any, res, buf) => {
          req.rawBody = buf;
        },
      }),
    );
    app.use(express.urlencoded({ extended: true }));

    app.use("/api/auth", authRoutes);
    app.use("/api/request", requestRoutes);
    app.use("/api/admin", require("./routes/admin.routes").default);
    app.use("/api/payments", paymentRoutes);

    io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("No token"));
        const payload = verifyToken(token);
        if (payload.type !== "access") {
          return next(new Error("Invalid access token"));
        }
        (socket as any).userId = payload.id;
        next();
      } catch (err) {
        next(new Error("Auth error"));
      }
    });

    io.on("connection", async (socket: Socket) => {
      const userId = (socket as any).userId;
      socketLog("connection", { userId, socketId: socket.id });

      const userRepo = AppDataSource.getRepository(User);
      const requestRepo = AppDataSource.getRepository(JobRequest);

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
        if (room.startsWith("request_")) socket.leave(room);
      });

      socket.join(`user_${userId}`);
      socket.join(`mechanic_${userId}`);

      const activeReq = await requestRepo.findOne({
        where: [
          { user: { id: userId }, status: In(ACTIVE_STATUSES) },
          {
            helper: { id: userId },
            status: In(["accepted", "arrived", "working"]),
          },
        ],
        relations: ["helper", "user"],
      });

      if (activeReq) {
        socket.join(`request_${activeReq.id}`);
      }

      socket.on("ride:location_update", ({ requestId, lat, lng }) => {
        if (
          !requestId ||
          typeof lat !== "number" ||
          typeof lng !== "number" ||
          Number.isNaN(lat) ||
          Number.isNaN(lng)
        ) {
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
      socketLog("ride:sync emitted", {
        userId,
        socketId: socket.id,
        isOnline: dbUser?.isOnline || false,
        requestId: activeReq?.id || null,
        status: activeReq?.status || null,
      });

      if (
        dbUser?.role === UserRole.HELPER &&
        dbUser.isOnline &&
        dbUser.availableBalance >= 0
      ) {
        onlineMechanics.set(userId, {
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
        socketLog("mechanic:online received", { userId, socketId: socket.id });
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

          onlineMechanics.set(userId, {
            socketId: socket.id,
            userId,
            lat: helperProfile.lat || null,
            lng: helperProfile.lng || null,
            isBusy: false,
            availableBalance: helperProfile.availableBalance,
          });
          socketLog("mechanic added to online map", {
            userId,
            socketId: socket.id,
            lat: helperProfile.lat || null,
            lng: helperProfile.lng || null,
            availableBalance: helperProfile.availableBalance,
          });

          const pendingRequests = await requestRepo.find({
            where: { status: "pending", helper: IsNull() },
            relations: ["user"],
            order: { createdAt: "DESC" },
            take: 15,
          });

          pendingRequests.forEach((req) => {
            if (
              req.user.id !== userId &&
              req.lat &&
              req.lng &&
              helperProfile.lat &&
              helperProfile.lng
            ) {
              const distance = getDistance(
                helperProfile.lat,
                helperProfile.lng,
                req.lat,
                req.lng,
              );
              if (distance <= MAX_DISTANCE_KM) {
                socketLog("request:new emitted from backlog", {
                  helperUserId: userId,
                  requestId: req.id,
                  requestUserId: req.user.id,
                  distanceKm: Number(distance.toFixed(2)),
                });
                socket.emit("request:new", {
                  requestId: req.id,
                  userId: req.user.id,
                  userName: req.user.name,
                  problemType: req.problemType,
                  description: req.description,
                  areaName: (req as any).areaName,
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
        socketLog("mechanic:offline received", { userId, socketId: socket.id });
        const helperProfile = await userRepo.findOneBy({ id: userId });
        if (helperProfile) {
          helperProfile.isOnline = false;
          helperProfile.isBusy = false;
          await userRepo.save(helperProfile);
        }
        onlineMechanics.delete(userId);
        performEmit();
      });

      socket.on("mechanic:location", async ({ lat, lng }) => {
        socketLog("mechanic:location received", {
          userId,
          socketId: socket.id,
          lat,
          lng,
        });
        if (
          typeof lat !== "number" ||
          typeof lng !== "number" ||
          Number.isNaN(lat) ||
          Number.isNaN(lng)
        ) {
          return;
        }

        let mech = onlineMechanics.get(userId);
        if (!mech) {
          const dbUser = await userRepo.findOneBy({ id: userId });
          if (dbUser && dbUser.availableBalance >= 0) {
            onlineMechanics.set(userId, {
              socketId: socket.id,
              userId,
              lat,
              lng,
              isBusy: dbUser?.isBusy || false,
              availableBalance: dbUser.availableBalance,
            });
            mech = onlineMechanics.get(userId);
          }
        }
        if (mech) {
          mech.lat = lat;
          mech.lng = lng;
          await userRepo.update({ id: userId }, { lat, lng });
          socketLog("mechanic location stored", {
            userId,
            socketId: socket.id,
            lat,
            lng,
            isBusy: mech.isBusy,
          });
          emitMechanicsThrottled();
        }
      });

      socket.on("ride:cancel", async ({ requestId }) => {
        const request = await requestRepo.findOne({
          where: { id: requestId },
          relations: ["user", "helper"],
        });
        if (!request || !ACTIVE_STATUSES.includes(request.status)) return;
        if (request.user.id !== userId && request.helper?.id !== userId) return;

        request.status = "cancelled";
        await requestRepo.save(request);

        if (request.helper) {
          await userRepo.update({ id: request.helper.id }, { isBusy: false });
          const mech = onlineMechanics.get(request.helper.id);
          if (mech) mech.isBusy = false;
        }

        io.to(`request_${requestId}`).emit("ride:cancelled", {
          requestId,
          cancelledBy: userId,
        });
        io.emit("request:unavailable", { requestId });
        io.to(`user_${request.user.id}`).emit("offers:clear");
        io.in(`request_${requestId}`).socketsLeave(`request_${requestId}`);
        performEmit();
      });

      socket.on("disconnect", async () => {
        socketLog("disconnect", { userId, socketId: socket.id });
        if (onlineMechanics.has(userId)) {
          onlineMechanics.delete(userId);
          await userRepo.update({ id: userId }, { isOnline: false });
          performEmit();
        }
      });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () =>
      console.log(`🚀 [SERVER] Running on port ${PORT}`),
    );
  } catch (error) {
    console.error("❌ [FATAL] Server failed to start:", error);
    process.exit(1);
  }
};

startServer();
