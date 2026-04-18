import { getDistance } from "geolib";
import * as Location from "expo-location";

export interface AppCoordinates {
  lat: number;
  lng: number;
}

export const hasValidCoordinates = (
  coords: AppCoordinates | null | undefined,
): coords is AppCoordinates =>
  !!coords &&
  Number.isFinite(coords.lat) &&
  Number.isFinite(coords.lng) &&
  Math.abs(coords.lat) <= 90 &&
  Math.abs(coords.lng) <= 180;

export const toAppCoordinates = (
  coords:
    | Location.LocationObjectCoords
    | {
        latitude?: number;
        longitude?: number;
        lat?: number;
        lng?: number;
      }
    | null
    | undefined,
): AppCoordinates | null => {
  if (!coords) {
    return null;
  }

  const coordsWithAliases = coords as {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
  };

  const lat =
    typeof coordsWithAliases.latitude === "number"
      ? coordsWithAliases.latitude
      : typeof coordsWithAliases.lat === "number"
      ? coordsWithAliases.lat
      : NaN;
  const lng =
    typeof coordsWithAliases.longitude === "number"
      ? coordsWithAliases.longitude
      : typeof coordsWithAliases.lng === "number"
      ? coordsWithAliases.lng
      : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

export const distanceKmBetween = (
  from: AppCoordinates | null | undefined,
  to: AppCoordinates | null | undefined,
) => {
  if (!hasValidCoordinates(from) || !hasValidCoordinates(to)) {
    return null;
  }

  return getDistance(from, to) / 1000;
};

export const sortByNearest = <T>(
  items: T[],
  currentLocation: AppCoordinates | null | undefined,
  getCoords: (item: T) => AppCoordinates | null | undefined,
) =>
  [...items].sort((left, right) => {
    const leftDistance = distanceKmBetween(currentLocation, getCoords(left));
    const rightDistance = distanceKmBetween(currentLocation, getCoords(right));

    if (leftDistance === null && rightDistance === null) {
      return 0;
    }

    if (leftDistance === null) {
      return 1;
    }

    if (rightDistance === null) {
      return -1;
    }

    return leftDistance - rightDistance;
  });
