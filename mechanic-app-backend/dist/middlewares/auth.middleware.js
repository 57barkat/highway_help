"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
const auth_util_1 = require("../utils/auth.util");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization header missing" });
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Token missing" });
        }
        const decoded = (0, auth_util_1.verifyToken)(token);
        if (decoded.type !== "access") {
            return res.status(401).json({ message: "Invalid access token" });
        }
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({
            where: { id: decoded.id },
        });
        if (!user) {
            return res.status(401).json({ message: "Invalid token" });
        }
        // ✅ Attach full user (role, categories, isOnline, etc.)
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
exports.authMiddleware = authMiddleware;
