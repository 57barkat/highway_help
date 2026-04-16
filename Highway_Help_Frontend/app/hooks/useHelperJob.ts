import { useState, useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const API_URL = "http://192.168.100.173:3000";

export interface Request {
  requestId: number;
  problemType: string;
  description: string;
  lat: number;
  lng: number;
  suggestedPrice: number;
  pending: string;
  status: string;
  userName: string;
  areaName?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export type JobStage =
  | "idle"
  | "navigating"
  | "arrived"
  | "working"
  | "completed";

export const useHelperJob = () => {
  const socketRef = useRef<any | null>(null);
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
  const [online, setOnline] = useState(false);
  const [helperLocation, setHelperLocation] = useState<LatLng | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<Request[]>([]);
  const [jobStage, setJobStage] = useState<JobStage>("idle");
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);

  const [stats, setStats] = useState({
    rating: 0,
    earnings: 0,
    count: 0,
    availableBalance: 0,
  });

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    setModalConfig({ visible: true, title, message, type });
  };

  const [agreedPrice, setAgreedPrice] = useState<number>(0);
  const stageRef = useRef<JobStage>("idle");
  const activeIdRef = useRef<number | null>(null);

  useEffect(() => {
    stageRef.current = jobStage;
  }, [jobStage]);

  useEffect(() => {
    activeIdRef.current = activeRequestId;
  }, [activeRequestId]);

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem("app_token");
      if (!token) return;
      const statsRes = await fetch(`${API_URL}/api/helper/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          rating: Number(statsData.rating || 0),
          earnings: Number(statsData.earnings || 0),
          count: Number(statsData.count || 0),
          availableBalance: Number(statsData.availableBalance || 0),
        });
      }
    } catch (err) {}
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await fetchStats();
      const token = await AsyncStorage.getItem("app_token");
      if (!token || !isMounted) return;

      socketRef.current = io(API_URL, {
        transports: ["websocket"],
        auth: { token },
      });

      socketRef.current.on("wallet:low_balance", (data: any) => {
        if (!isMounted) return;
        setOnline(false);
        locationWatcherRef.current?.remove();
        showModal("Wallet Empty", data.message, "error");
      });

      socketRef.current.on("ride:sync", (data: any) => {
        if (!isMounted) return;
        const inProgressStatuses = ["accepted", "arrived", "working"];
        if (data.requestId && inProgressStatuses.includes(data.status)) {
          setActiveRequestId(data.requestId);
          setIncomingRequests([]);
          const stageMap: Record<string, JobStage> = {
            accepted: "navigating",
            arrived: "arrived",
            working: "working",
          };
          setJobStage(stageMap[data.status]);
        } else {
          setActiveRequestId(null);
          setJobStage("idle");
        }
      });

      socketRef.current.on("ride:peer_location", (data: any) => {
        setUserLocation({ lat: data.lat, lng: data.lng });
      });

      socketRef.current.on("request:new", (req: Request) => {
        const isBusy =
          activeIdRef.current !== null ||
          ["navigating", "arrived", "working"].includes(stageRef.current);
        if (!isBusy) {
          setIncomingRequests((prev) => {
            const exists = prev.some((r) => r.requestId === req.requestId);
            if (exists) return prev;
            return [req, ...prev];
          });
        }
      });

      socketRef.current.on(
        "request:unavailable",
        ({ requestId }: { requestId: number }) => {
          setIncomingRequests((prev) =>
            prev.filter((r) => r.requestId !== requestId),
          );
        },
      );

      socketRef.current.on("ride:started", async (ride: any) => {
        if (!isMounted || !ride.userLocation) return;
        setJobStage("navigating");
        setActiveRequestId(ride.requestId);
        setAgreedPrice(ride.offeredPrice || ride.suggestedPrice || 0);
        setUserLocation(ride.userLocation);
        setIncomingRequests([]);
      });

      socketRef.current.on(
        "ride:cancelled",
        (data: { requestId: number; cancelledByRole: string }) => {
          if (data.cancelledByRole === "user") {
            showModal(
              "User Cancelled",
              "The user has cancelled this request. You are now marked as available.",
              "warning",
            );
          }
          setJobStage("idle");
          setActiveRequestId(null);
          setUserLocation(null);
          socketRef.current?.emit("mechanic:online");
        },
      );

      socketRef.current.on("stats:update", (data: any) => {
        if (!isMounted) return;
        setStats({
          rating: Number(data.rating),
          earnings: Number(data.earnings),
          count: Number(data.count),
          availableBalance: Number(data.availableBalance),
        });
      });

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        if (isMounted) {
          setHelperLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
        }
      }
    };
    init();
    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
    };
  }, []);

  const toggleOnline = async () => {
    await fetchStats();
    if (!helperLocation) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      if (!loc) return;
      setHelperLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    }

    const nextState = !online;

    if (nextState) {
      if (stats.availableBalance < 0) {
        showModal(
          "Restricted Access",
          `Pending Balance: Rs. ${Math.abs(stats.availableBalance)}. Please top up your wallet to continue.`,
          "error",
        );
        return;
      }

      setOnline(true);
      socketRef.current?.emit("mechanic:online");

      locationWatcherRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5 },
        (loc) => {
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;
          setHelperLocation({ lat, lng });
          socketRef.current?.emit("mechanic:location", { lat, lng });
          if (activeIdRef.current) {
            socketRef.current?.emit("ride:location_update", {
              requestId: activeIdRef.current,
              lat,
              lng,
            });
          }
        },
      );
    } else {
      setOnline(false);
      locationWatcherRef.current?.remove();
      socketRef.current?.emit("mechanic:offline");
      setJobStage("idle");
    }
  };

  const updateJobStatus = async (
    endpoint: string,
    nextStage: JobStage,
    bodyExtras = {},
  ) => {
    if (!activeRequestId) return false;
    try {
      const token = await AsyncStorage.getItem("app_token");
      const res = await fetch(`${API_URL}/api/request/helper/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId: activeRequestId, ...bodyExtras }),
      });
      if (res.ok) {
        if (nextStage === "completed") {
          setJobStage("idle");
          setActiveRequestId(null);
          setUserLocation(null);
          setIncomingRequests([]);
          socketRef.current?.emit("mechanic:online");
          showModal("Job Complete", "Excellent work!", "success");
        } else {
          setJobStage(nextStage);
        }
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  return {
    online,
    helperLocation,
    userLocation,
    incomingRequests,
    jobStage,
    stats,
    toggleOnline,
    modalConfig,
    setModalConfig,
    sendOffer: async (requestId: number, price: number) => {
      try {
        const token = await AsyncStorage.getItem("app_token");
        const res = await fetch(`${API_URL}/api/request/offer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ requestId, offeredPrice: price }),
        });
        return res.ok;
      } catch (err) {
        return false;
      }
    },
    agreedPrice,
    markArrived: () => updateJobStatus("arrived", "arrived"),
    startWork: () => updateJobStatus("start", "working"),
    completeWork: (finalPrice: number, minPrice: number) => {
      const priceToSend = Math.max(finalPrice, minPrice);
      return updateJobStatus("done", "completed", { finalPrice: priceToSend });
    },
    cancelRide: async () => {
      if (!activeRequestId) return;
      try {
        const token = await AsyncStorage.getItem("app_token");
        const res = await fetch(`${API_URL}/api/request/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ requestId: activeRequestId }),
        });
        if (res.ok) {
          setJobStage("idle");
          setActiveRequestId(null);
          setUserLocation(null);
          socketRef.current?.emit("mechanic:online");
        }
      } catch (err) {}
    },
  };
};
