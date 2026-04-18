"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUser = exports.hashToken = exports.verifyToken = exports.signRefreshToken = exports.signAccessToken = exports.REFRESH_TOKEN_MAX_AGE_MS = exports.REFRESH_TOKEN_TTL = exports.ACCESS_TOKEN_TTL = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const requireJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }
    return process.env.JWT_SECRET;
};
exports.ACCESS_TOKEN_TTL = "15m";
exports.REFRESH_TOKEN_TTL = "30d";
exports.REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const signAccessToken = (user) => jsonwebtoken_1.default.sign({ id: user.id, role: user.role, type: "access" }, requireJwtSecret(), { expiresIn: exports.ACCESS_TOKEN_TTL });
exports.signAccessToken = signAccessToken;
const signRefreshToken = (user) => jsonwebtoken_1.default.sign({ id: user.id, role: user.role, type: "refresh" }, requireJwtSecret(), { expiresIn: exports.REFRESH_TOKEN_TTL });
exports.signRefreshToken = signRefreshToken;
const verifyToken = (token) => jsonwebtoken_1.default.verify(token, requireJwtSecret());
exports.verifyToken = verifyToken;
const hashToken = (token) => crypto_1.default.createHash("sha256").update(token).digest("hex");
exports.hashToken = hashToken;
const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    categories: user.categories,
    isOnline: user.isOnline,
    isVerified: user.isVerified,
});
exports.sanitizeUser = sanitizeUser;
