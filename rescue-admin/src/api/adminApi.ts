import axios from "axios";
import { ADMIN_API_URL } from "./runtime";

export const adminApi = axios.create({
  baseURL: ADMIN_API_URL,
});

// Attach token to every request
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.assign("/login");
    }

    return Promise.reject(error);
  },
);
