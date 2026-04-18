"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const auth_secure_controller_1 = require("../controllers/auth.secure.controller");
const router = (0, express_1.Router)();
router.post("/register", auth_secure_controller_1.registerUser);
router.post("/login", auth_secure_controller_1.loginUser);
router.post("/refresh", auth_secure_controller_1.refreshSession);
router.post("/logout", auth_middleware_1.authMiddleware, auth_secure_controller_1.logoutUser);
router.get("/me", auth_middleware_1.authMiddleware, auth_secure_controller_1.getCurrentUser);
exports.default = router;
