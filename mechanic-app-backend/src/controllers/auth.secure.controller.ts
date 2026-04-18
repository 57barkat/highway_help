import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/db";
import { User, UserRole, HelperCategory } from "../entities/User";
import {
  hashToken,
  sanitizeUser,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  REFRESH_TOKEN_MAX_AGE_MS,
} from "../utils/auth.util";
import { normalizePhoneNumber } from "../utils/phone.util";
import { sendError, sendSuccess } from "../utils/response.util";
import { AuthRequest } from "../middlewares/auth.middleware";

interface RegisterBody {
  name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  role?: UserRole;
  categories?: HelperCategory[];
}

const getTokenBundle = async (user: User) => {
  const refreshToken = signRefreshToken(user);
  const accessToken = signAccessToken(user);
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

  await AppDataSource.getRepository(User).update(
    { id: user.id },
    { refreshTokenHash, refreshTokenExpiresAt },
  );

  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = refreshTokenExpiresAt;

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, phoneNumber, role, categories } =
    req.body as RegisterBody;

  try {
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const normalizedName = name?.trim();
    const normalizedRole =
      role === UserRole.HELPER ? UserRole.HELPER : UserRole.USER;

    if (
      !normalizedName ||
      !normalizedEmail ||
      !password ||
      !normalizedPhoneNumber
    ) {
      return sendError(
        res,
        400,
        "Name, email, phone number, and password are required",
      );
    }

    if (password.length < 8) {
      return sendError(res, 400, "Password must be at least 8 characters");
    }

    if (
      normalizedRole === UserRole.HELPER &&
      (!categories || categories.length === 0)
    ) {
      return sendError(
        res,
        400,
        "Helpers must select at least one service category",
      );
    }

    const userRepo = AppDataSource.getRepository(User);
    const existingUser = await userRepo.findOne({
      where: [
        { email: normalizedEmail },
        { phoneNumber: normalizedPhoneNumber },
      ],
    });

    if (existingUser) {
      return sendError(
        res,
        409,
        existingUser.email === normalizedEmail
          ? "Email already exists"
          : "Phone number already exists",
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = userRepo.create({
      name: normalizedName,
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      password: hashedPassword,
      role: normalizedRole,
      categories:
        normalizedRole === UserRole.HELPER ? categories ?? null : null,
      isOnline: false,
      isVerified: normalizedRole === UserRole.USER,
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    });

    await userRepo.save(newUser);

    return sendSuccess(
      res,
      201,
      "User registered successfully",
      await getTokenBundle(newUser),
    );
  } catch (err) {
    console.error("Register error:", err);
    return sendError(res, 500, "Server error");
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  try {
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return sendError(res, 400, "Email and password are required");
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return sendError(res, 401, "Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid credentials");
    }

    return sendSuccess(
      res,
      200,
      "Login successful",
      await getTokenBundle(user),
    );
  } catch (err) {
    console.error("Login error:", err);
    return sendError(res, 500, "Server error");
  }
};

export const refreshSession = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };

  try {
    if (!refreshToken) {
      return sendError(res, 400, "Refresh token is required");
    }

    const payload = verifyToken(refreshToken);
    if (payload.type !== "refresh") {
      return sendError(res, 401, "Invalid refresh token");
    }

    const userRepo = AppDataSource.getRepository(User);
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
      return sendError(res, 401, "Refresh session expired");
    }

    const isExpired = user.refreshTokenExpiresAt.getTime() < Date.now();
    const isTokenMatch = user.refreshTokenHash === hashToken(refreshToken);

    if (!isTokenMatch || isExpired) {
      user.refreshTokenHash = null;
      user.refreshTokenExpiresAt = null;
      await userRepo.save(user);
      return sendError(res, 401, "Refresh session expired");
    }

    return sendSuccess(
      res,
      200,
      "Session refreshed",
      await getTokenBundle(user),
    );
  } catch (err) {
    console.error("Refresh error:", err);
    return sendError(res, 401, "Invalid refresh token");
  }
};

export const logoutUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, "Unauthorized");
    }

    await AppDataSource.getRepository(User).update(
      { id: req.user.id },
      { refreshTokenHash: null, refreshTokenExpiresAt: null },
    );

    return sendSuccess(res, 200, "Logged out successfully");
  } catch (err) {
    console.error("Logout error:", err);
    return sendError(res, 500, "Server error");
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 401, "Unauthorized");
    }

    return sendSuccess(res, 200, "User profile fetched", {
      user: sanitizeUser(req.user),
    });
  } catch (err) {
    console.error("Profile error:", err);
    return sendError(res, 500, "Server error");
  }
};
