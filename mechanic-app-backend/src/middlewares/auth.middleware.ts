import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/db";
import { User } from "../entities/User";
import { verifyToken } from "../utils/auth.util";

export interface AuthRequest extends Request {
  user?: User;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== "access") {
      return res.status(401).json({ message: "Invalid access token" });
    }

    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // ✅ Attach full user (role, categories, isOnline, etc.)
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
