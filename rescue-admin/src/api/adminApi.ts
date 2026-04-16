import axios from "axios";

export const adminApi = axios.create({
  baseURL: "http://localhost:3000/api/admin",
});

// Attach token to every request
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
