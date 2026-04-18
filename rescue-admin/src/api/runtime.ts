const rawBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  "http://localhost:3000/api";

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");
export const ADMIN_API_URL = `${API_BASE_URL}/admin`;
