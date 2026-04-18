"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * =======================
 * REGISTER USER / HELPER
 * =======================
 */
const registerUser = async (req, res) => {
    const { name, email, password, role, categories } = req.body;
    try {
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        // ✅ Check existing user
        const existingUser = await userRepo.findOneBy({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = userRepo.create({
            name,
            email,
            password: hashedPassword,
            role: role ?? User_1.UserRole.USER,
            categories: role === User_1.UserRole.HELPER && Array.isArray(categories)
                ? categories
                : null,
            isOnline: false,
            isVerified: false,
        });
        await userRepo.save(newUser);
        console.log("✅ User registered:", newUser.id, newUser.role);
        res.status(201).json({
            message: "User registered successfully",
        });
    }
    catch (err) {
        console.error("❌ Register error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.registerUser = registerUser;
/**
 * =======================
 * LOGIN USER / HELPER
 * =======================
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRepo = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({
            where: { email },
        });
        if (!user) {
            console.log("❌ Invalid email");
            return res.status(400).json({ message: "Invalid email" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ Invalid password");
            return res.status(400).json({ message: "Invalid password" });
        }
        // ✅ JWT includes role (important for frontend & sockets)
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            role: user.role,
        }, process.env.JWT_SECRET, { expiresIn: "7d" });
        console.log("✅ User logged in:", user.id, user.role);
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                categories: user.categories,
                isOnline: user.isOnline,
            },
        });
    }
    catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.loginUser = loginUser;
