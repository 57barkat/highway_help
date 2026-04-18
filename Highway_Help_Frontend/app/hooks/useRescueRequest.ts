import { useState, useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import io from "socket.io-client";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { API_URL, BASE_URL, SOCKET_OPTIONS } from "@/lib/runtime";

export interface Offer {
  id: number;
  requestId: number;
  offeredPrice: number;
  distanceKm: number | null;
  helper: {
    userId: number;
    name: string;
    rating: number;
    ratingCount: number;
    lat: number;
    lng: number;
  };
}

export interface Mechanic {
  userId: number;
  lat: number;
  lng: number;
}

export const useRescueRequest = () => {
  const socketRef = useRef<any | null>(null);
  const lastLocationEmitRef = useRef(0);

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
  const currentRequestIdRef = useRef<number | null>(null);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [onlineMechanics, setOnlineMechanics] = useState<Mechanic[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [navigationData, setNavigationData] = useState<any | null>(null);

  const [peerLocation, setPeerLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [jobStage, setJobStage] = useState<"idle" | "searching" | "active">(
    "idle",
  );

  useEffect(() => {
    currentRequestIdRef.current = currentRequestId;
  }, [currentRequestId]);

  useEffect(() => {
    let isMounted = true;
    let locationWatcher: Location.LocationSubscription | null = null;

    const init = async () => {
      console.log("🚀 [INIT] Initializing Rescue Hook...");
      const token = await SecureStore.getItemAsync("app_token");

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        if (isMounted) {
          setUserLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
        }

        locationWatcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 15,
            timeInterval: 12000,
          },
          (newLoc) => {
            const { latitude: lat, longitude: lng } = newLoc.coords;
            if (isMounted) {
              setUserLocation({ lat, lng });
              const now = Date.now();
              if (
                currentRequestIdRef.current &&
                socketRef.current &&
                now - lastLocationEmitRef.current >= 4000
              ) {
                lastLocationEmitRef.current = now;
                socketRef.current.emit("ride:location_update", {
                  requestId: currentRequestIdRef.current,
                  lat,
                  lng,
                });
              }
            }
          },
        );
      }

      socketRef.current = io(BASE_URL, {
        ...SOCKET_OPTIONS,
        auth: { token },
      });

      socketRef.current.on("connect", () => {
        console.log(
          "🟢 [SOCKET] Connected. Ready to receive initial mechanics.",
        );
      });

      socketRef.current.on("mechanics:update", (data: Mechanic[]) => {
        console.log("👨‍🔧 [SYNC] Received Mechanics List. Count:", data.length);
        setOnlineMechanics(data);
      });

      socketRef.current.on("offers:clear", () => {
        setOffers([]);
        setIsSearching(false);
      });

      socketRef.current.on("ride:peer_location", (data: any) => {
        setPeerLocation({ lat: data.lat, lng: data.lng });
      });

      socketRef.current.on("ride:sync", (data: any) => {
        if (data.requestId) {
          setCurrentRequestId(data.requestId);
          const activeStages = ["accepted", "arrived", "working"];
          if (activeStages.includes(data.status) || data.hideOffers) {
            setJobStage("active");
            setIsSearching(false);
            setOffers([]);
          } else if (data.status === "pending") {
            setJobStage("searching");
            setIsSearching(true);
          }
        } else {
          setJobStage("idle");
          setIsSearching(false);
          setOffers([]);
          setPeerLocation(null);
        }
      });

      socketRef.current.on("offer:new", (offer: Offer) => {
        setOffers((prev) => [offer, ...prev]);
      });

      socketRef.current.on("helper:arrived", () => {
        showModal("📍 Arrived", "Your helper is here!", "success");
      });

      socketRef.current.on("helper:working", () => {
        showModal("🔧 Working", "Repairs have officially started.", "info");
      });

      socketRef.current.on(
        "ride:cancelled",
        (data: { cancelledByRole: string }) => {
          if (data.cancelledByRole === "helper") {
            showModal(
              "Ride Cancelled",
              "The mechanic is no longer available.",
              "error",
            );
          }
          setCurrentRequestId(null);
          setIsSearching(false);
          setJobStage("idle");
          setOffers([]);
          setPeerLocation(null);
          setNavigationData(null);
        },
      );

      socketRef.current.on("helper:completed", (data: any) => {
        setCurrentRequestId(data.requestId);
        setRatingVisible(true);
        setJobStage("idle");
        setPeerLocation(null);
      });
    };

    init();

    return () => {
      isMounted = false;
      locationWatcher?.remove();
      socketRef.current?.disconnect();
    };
  }, []);

  const cancelRide = async () => {
    if (!currentRequestId && !isSearching) return;

    // Note: Confirmation usually stays as Alert.alert for system security,
    // but I am updating the logic inside onPress to use showModal for errors.
    Alert.alert("Cancel Request", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          const idToCancel = currentRequestId;
          setCurrentRequestId(null);
          setIsSearching(false);
          setJobStage("idle");
          setOffers([]);
          setNavigationData(null);
          setPeerLocation(null);

          try {
            const token = await SecureStore.getItemAsync("app_token");
            const res = await fetch(`${API_URL}/request/cancel`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ requestId: idToCancel }),
            });
            if (!res.ok) {
              showModal(
                "Error",
                "Failed to cancel request on server.",
                "error",
              );
            }
          } catch (err) {
            showModal("Error", "Network error while cancelling.", "error");
          }
        },
      },
    ]);
  };

  const requestHelp = async (
    description: string,
    problemType: string,
    areaName?: string,
    radius: number = 5, // Default radius set to 5km
  ) => {
    // 1. Validation: Description Check
    if (!description.trim()) {
      showModal("Error", "Please describe the issue.", "warning");
      return false;
    }

    // 2. Validation: Location Check (Prevents the 'location unavailable' error)
    if (!userLocation?.lat || !userLocation?.lng) {
      showModal(
        "Location Error",
        "Your current location is not available. Please enable GPS.",
        "error",
      );
      return false;
    }

    setIsSearching(true);
    setJobStage("searching");

    try {
      const token = await SecureStore.getItemAsync("app_token");
      const res = await fetch(`${API_URL}/request/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemType: problemType || "general",
          description,
          areaName,
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius, // Sending current search radius to backend
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentRequestId(data.request.id);

        // --- RADIUS EXPANSION LOGIC ---
        if (data.noNearbyFound) {
          Alert.alert(
            "No Helper Nearby",
            `We couldn't find any mechanics within ${radius}km. Would you like to expand the search area?`,
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  cancelRide(); // Cleanup if user gives up
                },
              },
              {
                text: radius === 5 ? "Search in 10km" : "Search in 20km",
                onPress: () => {
                  // Recursive Call: Increase radius and try again
                  const nextRadius = radius === 5 ? 10 : 20;
                  requestHelp(description, problemType, areaName, nextRadius);
                },
              },
            ],
            { cancelable: false },
          );
        }
        return true;
      } else {
        showModal(
          "Error",
          data.message || "Could not create request.",
          "error",
        );
        setIsSearching(false);
        setJobStage("idle");
        return false;
      }
    } catch (err) {
      showModal("Error", "Check your internet connection.", "error");
      setIsSearching(false);
      setJobStage("idle");
      return false;
    }
  };

  const acceptOffer = async (offerId: number) => {
    try {
      const token = await SecureStore.getItemAsync("app_token");
      const res = await fetch(`${API_URL}/request/offer/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ offerId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentRequestId(data.request.id);
        setIsSearching(false);
        setJobStage("active");
        setOffers([]);
        setNavigationData(data.navigationData);
      } else {
        showModal(
          "Offer Error",
          data.message || "Could not accept offer",
          "error",
        );
      }
    } catch (err) {
      showModal("Error", "Connection failed while accepting offer.", "error");
    }
  };

  const submitRating = async (ratingValue: number) => {
    if (!currentRequestId) return;
    try {
      const token = await SecureStore.getItemAsync("app_token");
      const res = await fetch(`${API_URL}/request/user/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: currentRequestId,
          rating: ratingValue,
        }),
      });
      if (res.ok) {
        setRatingVisible(false);
        setCurrentRequestId(null);
        setJobStage("idle");
        setNavigationData(null);
        setPeerLocation(null);
        showModal("Thank You", "Your rating has been submitted!", "success");
      } else {
        showModal("Rating Error", "Could not submit rating.", "error");
      }
    } catch (err) {
      showModal("Error", "Failed to reach server.", "error");
    }
  };

  return {
    userLocation,
    onlineMechanics,
    offers,
    isSearching,
    jobStage,
    ratingVisible,
    currentRequestId,
    navigationData,
    peerLocation,
    setRatingVisible,
    requestHelp,
    acceptOffer,
    submitRating,
    cancelRide,
    modalConfig,
    setModalConfig,
  };
};
