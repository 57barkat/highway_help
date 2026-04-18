import { API_URL } from "@/lib/runtime";
import {
  clearSession,
  getStoredRefreshToken,
  getStoredToken,
  getStoredUser,
  persistSession,
} from "@/lib/auth-storage";

type RequestInitWithRetry = RequestInit & {
  _retry?: boolean;
};

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

let refreshPromise: Promise<string | null> | null = null;

const parseJwtExpiry = (token: string): number | null => {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decodedPayload.exp === "number" ? decodedPayload.exp * 1000 : null;
  } catch (error) {
    return null;
  }
};

const isTokenFresh = (token: string) => {
  const expiryTime = parseJwtExpiry(token);
  if (!expiryTime) {
    return true;
  }

  return expiryTime - Date.now() > ACCESS_TOKEN_REFRESH_BUFFER_MS;
};

const decodeUserFromStorage = async () => {
  const storedUser = await getStoredUser();
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    return null;
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) {
      await clearSession();
      return null;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await clearSession();
      return null;
    }

    const data = await response.json();
    const user = data.user ?? (await decodeUserFromStorage());

    if (!data.accessToken || !user) {
      await clearSession();
      return null;
    }

    await persistSession(data.accessToken, user, data.refreshToken);
    return data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

export const getValidAccessToken = async (): Promise<string | null> => {
  const token = await getStoredToken();
  if (token && isTokenFresh(token)) {
    return token;
  }

  return refreshAccessToken();
};

export const authFetch = async (
  input: string,
  init: RequestInitWithRetry = {},
) => {
  const token = await getValidAccessToken();

  if (!token) {
    throw new Error("Unauthorized");
  }

  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status !== 401 || init._retry) {
    return response;
  }

  const nextToken = await refreshAccessToken();
  if (!nextToken) {
    return response;
  }

  const retryHeaders = new Headers(init.headers ?? {});
  retryHeaders.set("Authorization", `Bearer ${nextToken}`);
  if (init.body && !retryHeaders.has("Content-Type")) {
    retryHeaders.set("Content-Type", "application/json");
  }

  const retryInit: RequestInit = {
    ...init,
    headers: retryHeaders,
  };

  return fetch(input, retryInit);
};
