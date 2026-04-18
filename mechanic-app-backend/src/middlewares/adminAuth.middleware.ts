import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/db";
import { User, UserRole } from "../entities/User";
import { verifyToken } from "../utils/auth.util";

interface AdminRequest extends Request {
  user?: User;
}

export const adminAuth = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = verifyToken(token);
    if (decoded.type !== "access") {
      return res.status(401).json({ message: "Invalid access token" });
    }
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: decoded.id } });

    if (!user || user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "Admins only" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
