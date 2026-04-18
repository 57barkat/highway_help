"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = void 0;
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
const auth_util_1 = require("../utils/auth.util");
const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token)
            return res.status(401).json({ message: "No token provided" });
        const decoded = (0, auth_util_1.verifyToken)(token);
        if (decoded.type !== "access") {
            return res.status(401).json({ message: "Invalid access token" });
        }
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: decoded.id } });
        if (!user || user.role !== User_1.UserRole.ADMIN) {
            return res.status(403).json({ message: "Admins only" });
        }
        req.user = user;
        next();
    }
    catch (err) {
        console.error(err);
        return res.status(401).json({ message: "Unauthorized" });
    }
};
exports.adminAuth = adminAuth;
