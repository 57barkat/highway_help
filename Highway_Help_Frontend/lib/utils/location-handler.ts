import * as Location from "expo-location";
import { Alert, Platform } from "react-native";

export interface LocationCoords {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

/**
 * Request location permissions from the user
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Location Permission Required",
        "YourWay needs access to your location to show nearby services and helpers. Please enable location access in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                // On iOS, users need to manually open settings
                Alert.alert(
                  "Open Settings",
                  "Go to Settings > YourWay > Location and enable location access."
                );
              }
            },
          },
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
};

/**
 * Get the user's current location
 * @returns Promise<LocationCoords | null> - User's current location or null if unavailable
 */
export const getCurrentLocation = async (): Promise<LocationCoords | null> => {
  try {
    // Check permission status first
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status !== "granted") {
      const granted = await requestLocationPermission();
      if (!granted) {
        return null;
      }
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  } catch (error) {
    console.error("Error getting current location:", error);
    Alert.alert(
      "Location Error",
      "Unable to get your current location. Please ensure location services are enabled."
    );
    return null;
  }
};

/**
 * Watch user's location for real-time updates
 * @param callback - Function to call when location changes
 * @returns Promise<Location.LocationSubscription | null> - Subscription object to remove later
 */
export const watchLocation = async (
  callback: (location: LocationCoords) => void
): Promise<Location.LocationSubscription | null> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    if (status !== "granted") {
      const granted = await requestLocationPermission();
      if (!granted) {
        return null;
      }
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 50, // Or when user moves 50 meters
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    );

    return subscription;
  } catch (error) {
    console.error("Error watching location:", error);
    return null;
  }
};

/**
 * Get address from coordinates (reverse geocoding)
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise<string | null> - Formatted address or null if unavailable
 */
export const getAddressFromCoords = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      const parts = [
        address.street,
        address.city,
        address.region,
        address.postalCode,
        address.country,
      ].filter(Boolean);
      return parts.join(", ");
    }

    return null;
  } catch (error) {
    console.error("Error getting address from coordinates:", error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates (in kilometers)
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns angle in radians
 */
const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Default location (used as fallback when location is unavailable)
 * This is set to a neutral location; you can change it to your city's coordinates
 */
export const DEFAULT_LOCATION: LocationCoords = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};
