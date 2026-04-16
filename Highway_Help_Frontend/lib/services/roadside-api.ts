// src/lib/services/roadside-api.ts
import axios from "axios";
import io from "socket.io-client";

// ===========================
// Types
// ===========================
export type ServiceType =
  | "flat_tire"
  | "fuel"
  | "battery"
  | "tow"
  | "lockout"
  | string;

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface RoadsideService {
  id: string;
  type: ServiceType;
  title: string;
  description: string;
  estimatedTime: string;
  available: boolean;
  price: string;
}

export type HelperStatus = "available" | "busy";

export interface Helper {
  id: number;
  name: string;
  location: LocationData;
  serviceType: ServiceType;
  rating: number;
  status: HelperStatus;
  distance?: number;
}

// ===========================
// Axios instance
// ===========================
const API_BASE_URL = "http://192.168.100.173:3000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// ===========================
// Socket.IO instance
// ===========================
let socket: any | null = null;

export const connectSocket = (): any => {
  if (!socket) {
    socket = io(API_BASE_URL.replace("/api", ""), {
      transports: ["websocket"],
    });

    socket.on("connect", () => console.log("🔵 Socket connected:", socket?.id));
    socket.on("disconnect", () => console.log("🔴 Socket disconnected"));
  }
  return socket;
};

// ===========================
// User API
// ===========================
export const userApi = {
  fetchAvailableServices: async (lat: number, lng: number) => {
    const res = await apiClient.get("/request/available", {
      params: { lat, lng },
    });
    return res.data;
  },

  requestService: async (serviceId: string, location: LocationData) => {
    const res = await apiClient.post("/request/create", {
      category: serviceId,
      userLat: location.latitude,
      userLng: location.longitude,
    });
    return res.data;
  },

  getNearbyHelpers: async (category: string) => {
    const res = await apiClient.get(`/user/mechanics/${category}`);
    return res.data;
  },

  updateMechanicLocation: async (lat: number, lng: number) => {
    const res = await apiClient.put("/user/me/location", { lat, lng });
    return res.data;
  },

  searchLocations: async (query: string) => {
    const res = await apiClient.get("/user/search-locations", {
      params: { query },
    });
    return res.data;
  },
};

// ===========================
// Wrapper functions
// ===========================
export const fetchAvailableServices = async (
  location: LocationData,
): Promise<RoadsideService[]> => {
  try {
    const services = await userApi.fetchAvailableServices(
      location.latitude,
      location.longitude,
    );

    return services.map((s: any) => ({
      id: String(s.id),
      type: s.category,
      title: s.category.charAt(0).toUpperCase() + s.category.slice(1),
      description: s.description || "",
      estimatedTime: s.estimatedTime || "30-60 min",
      available: s.status !== "pending",
      price: s.price || "$0",
    }));
  } catch (err) {
    console.error("fetchAvailableServices error:", err);
    return [];
  }
};

export const requestService = async (
  serviceId: string,
  location: LocationData,
): Promise<{
  success: boolean;
  message: string;
  estimatedArrival?: string;
}> => {
  try {
    const response = await userApi.requestService(serviceId, location);
    return {
      success: true,
      message: `${response.job.category} request confirmed!`,
      estimatedArrival: response.job.estimatedTime || "30-60 min",
    };
  } catch (err: any) {
    console.error("requestService error:", err);
    return {
      success: false,
      message: err?.response?.data?.message || "Failed to request service",
    };
  }
};

export const getNearbyHelpers = async (category: string): Promise<Helper[]> => {
  try {
    const helpers = await userApi.getNearbyHelpers(category);
    return helpers.map((h: any) => ({
      id: h.id,
      name: h.name,
      location: { latitude: h.lat, longitude: h.lng },
      serviceType: h.category,
      rating: h.rating || 5,
      status: h.isAvailable ? "available" : "busy",
    }));
  } catch (err) {
    console.error("getNearbyHelpers error:", err);
    return [];
  }
};

export const getNearbyHelpersCount = async (
  location: LocationData,
): Promise<number> => {
  try {
    const helpers = await getNearbyHelpers("all");
    return helpers.length;
  } catch (err) {
    console.error("getNearbyHelpersCount error:", err);
    return 0;
  }
};

export const searchLocations = async (query: string): Promise<any[]> => {
  try {
    const results = await userApi.searchLocations(query);
    return results;
  } catch (err) {
    console.error("searchLocations error:", err);
    return [];
  }
};

// ===========================
// Real-time Socket helpers
// ===========================
export const joinRequestRoom = (requestId: number) => {
  if (!socket) connectSocket();
  socket?.emit("join-request-room", requestId);
};

export const onMechanicLocationUpdate = (
  callback: (data: { lat: number; lng: number }) => void,
) => {
  if (!socket) connectSocket();
  socket?.on("update-location", callback);
};

export const onRouteUpdate = (callback: (routeData: any) => void) => {
  if (!socket) connectSocket();
  socket?.on("update-route", callback);
};

export const sendMechanicLocation = (data: {
  requestId: number;
  lat: number;
  lng: number;
}) => {
  if (!socket) connectSocket();
  socket?.emit("mechanic-location", data);
};
