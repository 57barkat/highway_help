"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.logoutUser = exports.refreshSession = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
const auth_util_1 = require("../utils/auth.util");
const phone_util_1 = require("../utils/phone.util");
const response_util_1 = require("../utils/response.util");
const getTokenBundle = async (user) => {
    const refreshToken = (0, auth_util_1.signRefreshToken)(user);
    const accessToken = (0, auth_util_1.signAccessToken)(user);
    const refreshTokenHash = (0, auth_util_1.hashToken)(refreshToken);
    const refreshTokenExpiresAt = new Date(Date.now() + auth_util_1.REFRESH_TOKEN_MAX_AGE_MS);
    await db_1.AppDataSource.getRepository(User_1.User).update({ id: user.id }, { refreshTokenHash, refreshTokenExpiresAt });
    user.refreshTokenHash = refreshTokenHash;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    return {
        accessToken,
        refreshToken,
        user: (0, auth_util_1.sanitizeUser)(user),
    };
};
const registerUser = async (req, res) => {
    const { name, email, password, phoneNumber, role, categories } = req.body;
    try {
        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedPhoneNumber = (0, phone_util_1.normalizePhoneNumber)(phoneNumber);
        const normalizedName = name?.trim();
        const normalizedRole = role === User_1.UserRole.HELPER ? User_1.UserRole.HELPER : User_1.UserRole.USER;
        if (!normalizedName ||
            !normalizedEmail ||
            !password ||
            !normalizedPhoneNumber) {
            return (0, response_util_1.sendError)(res, 400, "Name, email, phone number, and password are required");
        }
        if (password.length < 8) {
            return (0, response_util_1.sendError)(res, 400, "Password must be at least 8 characters");
        }
        if (normalizedRole === User_1.UserRole.HELPER &&
            (!categories || categories.length === 0)) {
            return (0, response_util_1.sendError)(res, 400, "Helpers must select at least one service category");
        }
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const existingUser = await userRepo.findOne({
            where: [
                { email: normalizedEmail },
                { phoneNumber: normalizedPhoneNumber },
            ],
        });
        if (existingUser) {
            return (0, response_util_1.sendError)(res, 409, existingUser.email === normalizedEmail
                ? "Email already exists"
                : "Phone number already exists");
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const newUser = userRepo.create({
            name: normalizedName,
            email: normalizedEmail,
            phoneNumber: normalizedPhoneNumber,
            password: hashedPassword,
            role: normalizedRole,
            categories: normalizedRole === User_1.UserRole.HELPER ? categories ?? null : null,
            isOnline: false,
            isVerified: normalizedRole === User_1.UserRole.USER,
            refreshTokenHash: null,
            refreshTokenExpiresAt: null,
        });
        await userRepo.save(newUser);
        return (0, response_util_1.sendSuccess)(res, 201, "User registered successfully", await getTokenBundle(newUser));
    }
    catch (err) {
        console.error("Register error:", err);
        return (0, response_util_1.sendError)(res, 500, "Server error");
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const normalizedEmail = email?.trim().toLowerCase();
        if (!normalizedEmail || !password) {
            return (0, response_util_1.sendError)(res, 400, "Email and password are required");
        }
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { email: normalizedEmail } });
        if (!user) {
            return (0, response_util_1.sendError)(res, 401, "Invalid credentials");
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return (0, response_util_1.sendError)(res, 401, "Invalid credentials");
        }
        return (0, response_util_1.sendSuccess)(res, 200, "Login successful", await getTokenBundle(user));
    }
    catch (err) {
        console.error("Login error:", err);
        return (0, response_util_1.sendError)(res, 500, "Server error");
    }
};
exports.loginUser = loginUser;
const refreshSession = async (req, res) => {
    const { refreshToken } = req.body;
    try {
        if (!refreshToken) {
            return (0, response_util_1.sendError)(res, 400, "Refresh token is required");
        }
        const payload = (0, auth_util_1.verifyToken)(refreshToken);
        if (payload.type !== "refresh") {
            return (0, response_util_1.sendError)(res, 401, "Invalid refresh token");
        }
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({
            where: { id: payload.id },
            select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                password: true,
                role: true,
                categories: true,
                isOnline: true,
                isVerified: true,
                refreshTokenHash: true,
                refreshTokenExpiresAt: true,
            },
        });
        if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
            return (0, response_util_1.sendError)(res, 401, "Refresh session expired");
        }
        const isExpired = user.refreshTokenExpiresAt.getTime() < Date.now();
        const isTokenMatch = user.refreshTokenHash === (0, auth_util_1.hashToken)(refreshToken);
        if (!isTokenMatch || isExpired) {
            user.refreshTokenHash = null;
            user.refreshTokenExpiresAt = null;
            await userRepo.save(user);
            return (0, response_util_1.sendError)(res, 401, "Refresh session expired");
        }
        return (0, response_util_1.sendSuccess)(res, 200, "Session refreshed", await getTokenBundle(user));
    }
    catch (err) {
        console.error("Refresh error:", err);
        return (0, response_util_1.sendError)(res, 401, "Invalid refresh token");
    }
};
exports.refreshSession = refreshSession;
const logoutUser = async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_util_1.sendError)(res, 401, "Unauthorized");
        }
        await db_1.AppDataSource.getRepository(User_1.User).update({ id: req.user.id }, { refreshTokenHash: null, refreshTokenExpiresAt: null });
        return (0, response_util_1.sendSuccess)(res, 200, "Logged out successfully");
    }
    catch (err) {
        console.error("Logout error:", err);
        return (0, response_util_1.sendError)(res, 500, "Server error");
    }
};
exports.logoutUser = logoutUser;
const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return (0, response_util_1.sendError)(res, 401, "Unauthorized");
        }
        return (0, response_util_1.sendSuccess)(res, 200, "User profile fetched", {
            user: (0, auth_util_1.sanitizeUser)(req.user),
        });
    }
    catch (err) {
        console.error("Profile error:", err);
        return (0, response_util_1.sendError)(res, 500, "Server error");
    }
};
exports.getCurrentUser = getCurrentUser;
