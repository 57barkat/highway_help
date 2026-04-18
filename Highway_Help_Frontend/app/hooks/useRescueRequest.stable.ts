import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import io from "socket.io-client";
import * as Location from "expo-location";
import { API_URL, BASE_URL, SOCKET_OPTIONS } from "@/lib/runtime";
import { getStoredToken } from "@/lib/auth-storage";
import { authFetch } from "@/lib/auth-client";
import {
  AppCoordinates,
  distanceKmBetween,
  hasValidCoordinates,
  sortByNearest,
  toAppCoordinates,
} from "@/lib/location";

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
    phoneNumber?: string | null;
  };
}

export interface Mechanic {
  userId: number;
  lat: number;
  lng: number;
  distanceKm?: number | null;
}

const sortMechanicsByDistance = (
  mechanics: Mechanic[],
  currentLocation: AppCoordinates | null,
) =>
  sortByNearest(mechanics, currentLocation, (mechanic) => ({
    lat: mechanic.lat,
    lng: mechanic.lng,
  })).map((mechanic) => ({
    ...mechanic,
    distanceKm:
      distanceKmBetween(currentLocation, {
        lat: mechanic.lat,
        lng: mechanic.lng,
      }) ?? null,
  }));

export const useRescueRequest = () => {
  const socketRef = useRef<any | null>(null);
  const lastLocationEmitRef = useRef(0);
  const currentRequestIdRef = useRef<number | null>(null);
  const userLocationRef = useRef<AppCoordinates | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [userLocation, setUserLocation] = useState<AppCoordinates | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [onlineMechanics, setOnlineMechanics] = useState<Mechanic[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [navigationData, setNavigationData] = useState<any | null>(null);
  const [peerLocation, setPeerLocation] = useState<AppCoordinates | null>(null);
  const [jobStage, setJobStage] = useState<"idle" | "searching" | "active">(
    "idle",
  );

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    setModalConfig({ visible: true, title, message, type });
  };

  useEffect(() => {
    currentRequestIdRef.current = currentRequestId;
  }, [currentRequestId]);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const requestLocationAccess = async () => {
    setIsLocationLoading(true);

    const currentPermission = await Location.getForegroundPermissionsAsync();
    let status = currentPermission.status;

    if (status !== "granted") {
      const requestedPermission =
        await Location.requestForegroundPermissionsAsync();
      status = requestedPermission.status;
    }

    if (status !== "granted") {
      setHasLocationPermission(false);
      setIsLocationLoading(false);
      showModal(
        "Location Required",
        "Enable location to discover nearby helpers and send roadside requests.",
        "warning",
      );
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const nextCoordinates = toAppCoordinates(location.coords);

    setHasLocationPermission(true);
    setIsLocationLoading(false);

    if (nextCoordinates) {
      setUserLocation(nextCoordinates);
    }

    return nextCoordinates;
  };

  useEffect(() => {
    let isMounted = true;
    let locationWatcher: Location.LocationSubscription | null = null;

    const init = async () => {
      const token = await getStoredToken();
      if (!token) {
        setIsLocationLoading(false);
        return;
      }

      const initialLocation = await requestLocationAccess();
      if (!isMounted || !initialLocation) {
        return;
      }

      locationWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 15,
          timeInterval: 12000,
        },
        (newLoc) => {
          const updatedCoordinates = toAppCoordinates(newLoc.coords);
          if (!isMounted || !updatedCoordinates) {
            return;
          }

          setUserLocation(updatedCoordinates);
          setOnlineMechanics((prev) =>
            sortMechanicsByDistance(prev, updatedCoordinates),
          );

          const now = Date.now();
          if (
            currentRequestIdRef.current &&
            socketRef.current &&
            now - lastLocationEmitRef.current >= 4000
          ) {
            lastLocationEmitRef.current = now;
            socketRef.current.emit("ride:location_update", {
              requestId: currentRequestIdRef.current,
              lat: updatedCoordinates.lat,
              lng: updatedCoordinates.lng,
            });
          }
        },
      );

      socketRef.current = io(BASE_URL, {
        ...SOCKET_OPTIONS,
        auth: { token },
      });

      socketRef.current.on("mechanics:update", (data: Mechanic[]) => {
        const validMechanics = data.filter((mechanic) =>
          hasValidCoordinates(mechanic),
        );
        setOnlineMechanics(
          sortMechanicsByDistance(validMechanics, userLocationRef.current),
        );
      });

      socketRef.current.on("offers:clear", () => {
        setOffers([]);
        setIsSearching(false);
      });

      socketRef.current.on("ride:peer_location", (data: any) => {
        const coordinates = toAppCoordinates(data);
        if (coordinates) {
          setPeerLocation(coordinates);
        }
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
        showModal(
          "Helper Arrived",
          "Your helper has reached your location.",
          "success",
        );
      });

      socketRef.current.on("helper:working", () => {
        showModal("Repair Started", "Your helper has started working.", "info");
      });

      socketRef.current.on(
        "ride:cancelled",
        (data: { cancelledByRole: string }) => {
          if (data.cancelledByRole === "helper") {
            showModal(
              "Ride Cancelled",
              "The helper is no longer available.",
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
            const res = await authFetch(`${API_URL}/request/cancel`, {
              method: "POST",
              body: JSON.stringify({ requestId: idToCancel }),
            });
            if (!res.ok) {
              showModal(
                "Error",
                "Failed to cancel request on the server.",
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
    radius: number = 5,
  ) => {
    if (!description.trim()) {
      showModal("Error", "Please describe the issue.", "warning");
      return false;
    }

    const currentLocation = hasValidCoordinates(userLocation)
      ? userLocation
      : await requestLocationAccess();

    if (!currentLocation) {
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
      const res = await authFetch(`${API_URL}/request/create`, {
        method: "POST",
        body: JSON.stringify({
          problemType: problemType || "General Help",
          description,
          areaName,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          radius,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentRequestId(data.request.id);

        if (data.noNearbyFound) {
          const visibleNearbyHelpers = onlineMechanics.filter((mechanic) => {
            const distance = distanceKmBetween(currentLocation, mechanic);
            return distance !== null && distance <= radius;
          }).length;

          Alert.alert(
            visibleNearbyHelpers > 0 ? "Helpers Are Syncing" : "No Helper Nearby",
            visibleNearbyHelpers > 0
              ? `We can see ${visibleNearbyHelpers} online helper(s), but none has picked up your request yet. You can expand the radius to reach more helpers.`
              : `We couldn't find any mechanics within ${radius}km. Would you like to expand the search area?`,
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  cancelRide();
                },
              },
              {
                text: radius === 5 ? "Search in 10km" : "Search in 20km",
                onPress: () => {
                  const nextRadius = radius === 5 ? 10 : 20;
                  requestHelp(description, problemType, areaName, nextRadius);
                },
              },
            ],
            { cancelable: false },
          );
        }
        return true;
      }

      showModal("Error", data.message || "Could not create request.", "error");
      setIsSearching(false);
      setJobStage("idle");
      return false;
    } catch (err) {
      showModal("Error", "Check your internet connection.", "error");
      setIsSearching(false);
      setJobStage("idle");
      return false;
    }
  };

  const acceptOffer = async (offerId: number) => {
    try {
      const res = await authFetch(`${API_URL}/request/offer/accept`, {
        method: "POST",
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
      const res = await authFetch(`${API_URL}/request/user/rate`, {
        method: "POST",
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
    hasLocationPermission,
    isLocationLoading,
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
    requestLocationAccess,
    modalConfig,
    setModalConfig,
  };
};
