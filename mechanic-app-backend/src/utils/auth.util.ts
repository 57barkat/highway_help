import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User, UserRole } from "../entities/User";

type AuthTokenType = "access" | "refresh";

interface AuthTokenPayload {
  id: number;
  role: UserRole;
  type: AuthTokenType;
}

const requireJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return process.env.JWT_SECRET;
};

export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL = "30d";
export const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const signAccessToken = (user: User) =>
  jwt.sign(
    { id: user.id, role: user.role, type: "access" } satisfies AuthTokenPayload,
    requireJwtSecret(),
    { expiresIn: ACCESS_TOKEN_TTL },
  );

export const signRefreshToken = (user: User) =>
  jwt.sign(
    { id: user.id, role: user.role, type: "refresh" } satisfies AuthTokenPayload,
    requireJwtSecret(),
    { expiresIn: REFRESH_TOKEN_TTL },
  );

export const verifyToken = (token: string) =>
  jwt.verify(token, requireJwtSecret()) as AuthTokenPayload;

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const sanitizeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  categories: user.categories,
  isOnline: user.isOnline,
  isVerified: user.isVerified,
});
