// src/routes/auth.routes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  getCurrentUser,
} from "../controllers/auth.secure.controller";

const router = Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshSession);
router.post("/logout", authMiddleware, logoutUser);
router.get("/me", authMiddleware, getCurrentUser);

export default router;
