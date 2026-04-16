import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "https://giovanna-smashable-intimately.ngrok-free.dev/api",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("app_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
