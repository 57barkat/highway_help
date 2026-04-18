"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = void 0;
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_util_1 = require("../utils/auth.util");
const response_util_1 = require("../utils/response.util");
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return (0, response_util_1.sendError)(res, 400, "Email & password required");
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { email } });
        if (!user)
            return (0, response_util_1.sendError)(res, 404, "User not found");
        if (user.role !== User_1.UserRole.ADMIN)
            return (0, response_util_1.sendError)(res, 403, "Admins only");
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword)
            return (0, response_util_1.sendError)(res, 401, "Invalid credentials");
        const token = (0, auth_util_1.signAccessToken)(user);
        return (0, response_util_1.sendSuccess)(res, 200, "Login successful", {
            token,
            user: { id: user.id, name: user.name, email: user.email },
        });
    }
    catch (err) {
        console.error(err);
        return (0, response_util_1.sendError)(res, 500, "Server error");
    }
};
exports.adminLogin = adminLogin;
