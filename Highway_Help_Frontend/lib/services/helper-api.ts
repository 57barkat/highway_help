import { ServiceType } from "../types";

export interface Helper {
  id: string;
  name: string;
  rating: number;
  serviceType: ServiceType;
  status: "available" | "busy" | "offline";
  location: {
    latitude: number;
    longitude: number;
  };
  vehicleType?: string;
  distance?: number; // in kilometers
}

// Color codes for different helper statuses
export const HELPER_STATUS_COLORS = {
  available: "#10B981", // Green
  busy: "#F59E0B", // Orange
  offline: "#6B7280", // Gray
};

// Mock helper data - distributed around a central location
export const generateNearbyHelpers = (
  centerLat: number,
  centerLng: number,
  count: number = 8
): Helper[] => {
  const helpers: Helper[] = [];
  const serviceTypes: ServiceType[] = [
    "flat_tire",
    "fuel",
    "battery",
    "tow",
    "lockout",
  ];
  const names = [
    "Ahmed Khan",
    "Sara Ali",
    "Hassan Raza",
    "Fatima Shah",
    "Bilal Ahmed",
    "Ayesha Malik",
    "Imran Hussain",
    "Zainab Khan",
    "Usman Ali",
    "Mariam Syed",
  ];

  for (let i = 0; i < count; i++) {
    // Generate random position within ~5km radius
    const angle = (Math.PI * 2 * i) / count;
    const radius = 0.02 + Math.random() * 0.03; // ~2-5km

    const helper: Helper = {
      id: `helper-${i + 1}`,
      name: names[i % names.length],
      rating: 4.0 + Math.random() * 1.0, // 4.0 to 5.0
      serviceType: serviceTypes[i % serviceTypes.length],
      status:
        Math.random() > 0.3
          ? "available"
          : Math.random() > 0.5
          ? "busy"
          : "offline",
      location: {
        latitude: centerLat + radius * Math.cos(angle),
        longitude: centerLng + radius * Math.sin(angle),
      },
      vehicleType: ["Truck", "Van", "Motorcycle", "Car"][
        Math.floor(Math.random() * 4)
      ],
      distance: Math.random() * 5 + 0.5, // 0.5 to 5.5 km
    };

    helpers.push(helper);
  }

  return helpers;
};

/**
 * Mock API to fetch nearby helpers based on location
 */
export const fetchNearbyHelpers = async (
  latitude: number,
  longitude: number
): Promise<Helper[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  return generateNearbyHelpers(latitude, longitude, 8);
};

/**
 * Filter helpers by service type
 */
export const filterHelpersByService = (
  helpers: Helper[],
  serviceType: ServiceType | null
): Helper[] => {
  if (!serviceType) return helpers;
  return helpers.filter((helper) => helper.serviceType === serviceType);
};

/**
 * Get available helpers only
 */
export const getAvailableHelpers = (helpers: Helper[]): Helper[] => {
  return helpers.filter((helper) => helper.status === "available");
};
