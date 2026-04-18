const normalizeUrl = (value: string) =>
  value.replace(/\s+/g, "").replace(/\/+$/, "");

const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_BASE_URL ||
  "http://192.168.1.6:3000/api";

export const API_URL = normalizeUrl(
  rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`,
);

export const BASE_URL = API_URL.replace(/\/api$/, "");

export const SOCKET_OPTIONS = {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,
  timeout: 10000,
};
