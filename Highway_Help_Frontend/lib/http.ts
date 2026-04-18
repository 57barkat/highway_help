import axios from "axios";
import { API_URL } from "@/lib/runtime";
import { clearSession } from "@/lib/auth-storage";
import { getValidAccessToken, refreshAccessToken } from "@/lib/auth-client";

export const httpClient = axios.create({
  baseURL: API_URL,
  timeout: 50000,
});

// Attach token to every request
httpClient.interceptors.request.use(async (config) => {
  const token = await getValidAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        if (accessToken) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${accessToken}`,
          };

          return httpClient(originalRequest);
        }
      } catch (refreshError) {
        await clearSession();
        return Promise.reject(refreshError);
      }

      await clearSession();
    }

    return Promise.reject(error);
  },
);
