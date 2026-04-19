import { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { API_URL, BASE_URL, SOCKET_OPTIONS } from "@/lib/runtime";
import { getStoredToken } from "@/lib/auth-storage";
import { authFetch } from "@/lib/auth-client";
import { useAuth } from "@/context/auth";
import {
  AppCoordinates,
  distanceKmBetween,
  hasValidCoordinates,
  sortByNearest,
  toAppCoordinates,
} from "@/lib/location";

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
  distance?: string | number;
  distanceKm?: number | null;
}

export interface LatLng extends AppCoordinates {}

export type JobStage =
  | "idle"
  | "navigating"
  | "arrived"
  | "working"
  | "completed";

const prioritizeRequests = (
  requests: Request[],
  helperLocation: LatLng | null,
) => {
  const sorted = sortByNearest(requests, helperLocation, (request) => ({
    lat: request.lat,
    lng: request.lng,
  }));

  return sorted.map((request) => ({
    ...request,
    distanceKm:
      distanceKmBetween(helperLocation, {
        lat: request.lat,
        lng: request.lng,
      }) ?? null,
  }));
};

export const useHelperJob = () => {
  const { isAuthenticated, user } = useAuth();
  const socketRef = useRef<any | null>(null);
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastLocationEmitRef = useRef(0);
  const stageRef = useRef<JobStage>("idle");
  const activeIdRef = useRef<number | null>(null);
  const helperLocationRef = useRef<LatLng | null>(null);

  const [online, setOnline] = useState(false);
  const [helperLocation, setHelperLocation] = useState<LatLng | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<Request[]>([]);
  const [jobStage, setJobStage] = useState<JobStage>("idle");
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [nearbyNotification, setNearbyNotification] = useState<Request | null>(
    null,
  );

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
  const helperLog = (label: string, payload?: unknown) => {
    console.log(
      `[helper-hook] ${new Date().toISOString()} ${label}`,
      payload ?? {},
    );
  };

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    setModalConfig({ visible: true, title, message, type });
  };

  useEffect(() => {
    stageRef.current = jobStage;
  }, [jobStage]);

  useEffect(() => {
    activeIdRef.current = activeRequestId;
  }, [activeRequestId]);

  useEffect(() => {
    helperLocationRef.current = helperLocation;
  }, [helperLocation]);

  const emitOnlinePresence = (coordinates?: LatLng | null) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      helperLog("emitOnlinePresence skipped - socket not connected", {
        online,
        hasCoordinates: Boolean(coordinates ?? helperLocationRef.current),
      });
      return false;
    }

    const nextCoordinates = coordinates ?? helperLocationRef.current;
    if (nextCoordinates) {
      helperLog("emit mechanic:location", nextCoordinates);
      socket.emit("mechanic:location", nextCoordinates);
    }

    helperLog("emit mechanic:online", {
      userId: user?.id,
      socketId: socket.id,
    });
    socket.emit("mechanic:online");

    return true;
  };

  const ensureHelperLocation = async () => {
    const currentPermission = await Location.getForegroundPermissionsAsync();
    let status = currentPermission.status;

    if (status !== "granted") {
      const requestedPermission =
        await Location.requestForegroundPermissionsAsync();
      status = requestedPermission.status;
    }

    if (status !== "granted") {
      showModal(
        "Location Required",
        "Enable location before going online or receiving nearby requests.",
        "warning",
      );
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const coordinates = toAppCoordinates(location.coords);

    if (coordinates) {
      setHelperLocation(coordinates);
      setLocationReady(true);
      setIncomingRequests((prev) => prioritizeRequests(prev, coordinates));
    }

    return coordinates;
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setIsBootstrapping(true);
      if (!isAuthenticated || user?.role !== "helper") {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocketConnected(false);
        setIsBootstrapping(false);
        return;
      }

      const token = await getStoredToken();
      if (!token || !isMounted) {
        setIsBootstrapping(false);
        return;
      }

      await ensureHelperLocation();

      socketRef.current?.disconnect();
      setSocketConnected(false);
      socketRef.current = io(BASE_URL, {
        ...SOCKET_OPTIONS,
        auth: { token },
      });
      helperLog("socket created", { userId: user?.id });

      socketRef.current.on("connect", () => {
        setSocketConnected(true);
        setIsBootstrapping(false);
        helperLog("socket connected", {
          userId: user?.id,
          socketId: socketRef.current?.id,
          online,
        });
        if (!isMounted) return;

      });
      socketRef.current.on("disconnect", (reason: string) => {
        setSocketConnected(false);
        helperLog("socket disconnected", {
          userId: user?.id,
          reason,
        });
      });

      socketRef.current.on("wallet:low_balance", (data: any) => {
        if (!isMounted) return;
        setOnline(false);
        locationWatcherRef.current?.remove();
        showModal("Wallet Empty", data.message, "error");
      });

      socketRef.current.on("ride:sync", (data: any) => {
        helperLog("ride:sync received", {
          userId: user?.id,
          requestId: data?.requestId ?? null,
          status: data?.status ?? null,
          isOnline: data?.isOnline ?? null,
        });
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
        const coordinates = toAppCoordinates(data);
        if (coordinates) {
          setUserLocation(coordinates);
        }
      });

      socketRef.current.on("request:new", async (request: Request) => {
        helperLog("request:new received", {
          requestId: request.requestId,
          userName: request.userName,
          distance: request.distance,
          distanceKm: request.distanceKm ?? null,
          stage: stageRef.current,
          activeRequestId: activeIdRef.current,
        });
        const isBusy =
          activeIdRef.current !== null ||
          ["navigating", "arrived", "working"].includes(stageRef.current);
        if (isBusy) {
          helperLog("request:new ignored because helper is busy", {
            requestId: request.requestId,
            stage: stageRef.current,
            activeRequestId: activeIdRef.current,
          });
          return;
        }

        const enrichedRequest: Request = {
          ...request,
          distanceKm:
            distanceKmBetween(helperLocationRef.current, {
              lat: request.lat,
              lng: request.lng,
            }) ?? null,
        };

        setIncomingRequests((prev) => {
          const exists = prev.some((item) => item.requestId === request.requestId);
          if (exists) {
            helperLog("request:new already exists in list", {
              requestId: request.requestId,
              listSize: prev.length,
            });
            return prev;
          }

          const next = prioritizeRequests(
            [...prev, enrichedRequest],
            helperLocationRef.current,
          );
          helperLog("incomingRequests updated from request:new", {
            requestId: request.requestId,
            nextSize: next.length,
            requestIds: next.map((item) => item.requestId),
          });
          return next;
        });

        setNearbyNotification(enrichedRequest);
        helperLog("nearbyNotification updated", {
          requestId: enrichedRequest.requestId,
        });
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      });

      socketRef.current.on(
        "request:unavailable",
        ({ requestId }: { requestId: number }) => {
          helperLog("request:unavailable received", { requestId });
          setIncomingRequests((prev) =>
            prev.filter((request) => request.requestId !== requestId),
          );
          setNearbyNotification((prev) =>
            prev?.requestId === requestId ? null : prev,
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
        setNearbyNotification(null);
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
    };

    init();
    return () => {
      isMounted = false;
      setSocketConnected(false);
      socketRef.current?.disconnect();
      locationWatcherRef.current?.remove();
    };
  }, [isAuthenticated, user?.id, user?.role]);

  useEffect(() => {
    if (!online || !socketConnected) {
      return;
    }

    emitOnlinePresence();
  }, [online, socketConnected]);

  const [agreedPrice, setAgreedPrice] = useState<number>(0);

  const toggleOnline = async () => {
    const coordinates = hasValidCoordinates(helperLocation)
      ? helperLocation
      : await ensureHelperLocation();
    if (!coordinates) {
      return;
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
      helperLog("toggleOnline -> ON", {
        userId: user?.id,
        coordinates,
      });
      emitOnlinePresence(coordinates);

      locationWatcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 15,
          timeInterval: 12000,
        },
        (location) => {
          const nextCoordinates = toAppCoordinates(location.coords);
          if (!nextCoordinates) {
            return;
          }

          const now = Date.now();
          const shouldEmit = now - lastLocationEmitRef.current >= 4000;
          setHelperLocation(nextCoordinates);
          setIncomingRequests((prev) =>
            prioritizeRequests(prev, nextCoordinates),
          );

          if (shouldEmit) {
            lastLocationEmitRef.current = now;
            helperLog("watchPosition emit mechanic:location", nextCoordinates);
            socketRef.current?.emit("mechanic:location", nextCoordinates);
          }

          if (activeIdRef.current && shouldEmit) {
            socketRef.current?.emit("ride:location_update", {
              requestId: activeIdRef.current,
              lat: nextCoordinates.lat,
              lng: nextCoordinates.lng,
            });
          }
        },
      );
    } else {
      setOnline(false);
      helperLog("toggleOnline -> OFF", { userId: user?.id });
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
      const res = await authFetch(`${API_URL}/request/helper/${endpoint}`, {
        method: "POST",
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

  const prioritizedIncomingRequests = useMemo(
    () => prioritizeRequests(incomingRequests, helperLocation),
    [incomingRequests, helperLocation],
  );

  const helperStatusMessage = !isAuthenticated || user?.role !== "helper"
    ? "Signing in helper workspace..."
    : isBootstrapping
    ? "Preparing helper workspace..."
    : !locationReady
    ? "Getting your location ready..."
    : !socketConnected
    ? "Connecting realtime requests..."
    : online
    ? "Visible to customers"
    : "Tap to start receiving jobs";

  const canToggleOnline =
    isAuthenticated &&
    user?.role === "helper" &&
    locationReady &&
    socketConnected &&
    !isBootstrapping;

  return {
    online,
    helperLocation,
    userLocation,
    incomingRequests: prioritizedIncomingRequests,
    nearbyNotification,
    clearNearbyNotification: () => setNearbyNotification(null),
    jobStage,
    stats,
    locationReady,
    isBootstrapping,
    socketConnected,
    helperStatusMessage,
    canToggleOnline,
    toggleOnline,
    modalConfig,
    setModalConfig,
    sendOffer: async (requestId: number, price: number) => {
      try {
        const res = await authFetch(`${API_URL}/request/offer`, {
          method: "POST",
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
        const res = await authFetch(`${API_URL}/request/cancel`, {
          method: "POST",
          body: JSON.stringify({ requestId: activeRequestId }),
        });
        if (res.ok) {
          setJobStage("idle");
          setActiveRequestId(null);
          setUserLocation(null);
          socketRef.current?.emit("mechanic:online");
        }
      } catch (err) {
        showModal("Unable to Cancel", "Unable to cancel the ride right now.", "error");
      }
    },
  };
};
