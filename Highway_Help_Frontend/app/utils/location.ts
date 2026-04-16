import * as Location from "expo-location";
import { UserLocation } from "../types/map.types";

export const getLiveLocation = async (): Promise<UserLocation | null> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
  };
};

export const isValidCoordinate = (lat: number, lng: number) =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  !isNaN(lat) &&
  !isNaN(lng);
