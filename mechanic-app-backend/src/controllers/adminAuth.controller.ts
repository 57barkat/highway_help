import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { User, UserRole } from "../entities/User";
import bcrypt from "bcryptjs";
import { signAccessToken } from "../utils/auth.util";
import { sendError, sendSuccess } from "../utils/response.util";

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return sendError(res, 400, "Email & password required");

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email } });

    if (!user) return sendError(res, 404, "User not found");
    if (user.role !== UserRole.ADMIN)
      return sendError(res, 403, "Admins only");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return sendError(res, 401, "Invalid credentials");

    const token = signAccessToken(user);

    return sendSuccess(res, 200, "Login successful", {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Server error");
  }
};
