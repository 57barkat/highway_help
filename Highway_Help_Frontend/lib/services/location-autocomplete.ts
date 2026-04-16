export interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: "address" | "landmark" | "city" | "area";
}

// Mock location data for Karachi, Pakistan
const MOCK_LOCATIONS: LocationSuggestion[] = [
  {
    id: "1",
    name: "Clifton Beach",
    address: "Clifton, Karachi, Pakistan",
    coordinates: { latitude: 24.8138, longitude: 67.0271 },
    type: "landmark",
  },
  {
    id: "2",
    name: "Saddar",
    address: "Saddar Town, Karachi, Pakistan",
    coordinates: { latitude: 24.8607, longitude: 67.0011 },
    type: "area",
  },
  {
    id: "3",
    name: "Gulshan-e-Iqbal",
    address: "Gulshan-e-Iqbal, Karachi, Pakistan",
    coordinates: { latitude: 24.9207, longitude: 67.0825 },
    type: "area",
  },
  {
    id: "4",
    name: "DHA Phase 5",
    address: "Defence Housing Authority, Karachi, Pakistan",
    coordinates: { latitude: 24.8155, longitude: 67.0612 },
    type: "area",
  },
  {
    id: "5",
    name: "Karachi Airport",
    address: "Jinnah International Airport, Karachi, Pakistan",
    coordinates: { latitude: 24.9065, longitude: 67.1608 },
    type: "landmark",
  },
  {
    id: "6",
    name: "Shahrah-e-Faisal",
    address: "Shahrah-e-Faisal Road, Karachi, Pakistan",
    coordinates: { latitude: 24.8718, longitude: 67.0648 },
    type: "address",
  },
  {
    id: "7",
    name: "Karsaz",
    address: "Karsaz Road, Karachi, Pakistan",
    coordinates: { latitude: 24.8759, longitude: 67.0697 },
    type: "area",
  },
  {
    id: "8",
    name: "Sea View",
    address: "Sea View, Clifton, Karachi, Pakistan",
    coordinates: { latitude: 24.8138, longitude: 67.0308 },
    type: "landmark",
  },
  {
    id: "9",
    name: "Bahadurabad",
    address: "Bahadurabad, Karachi, Pakistan",
    coordinates: { latitude: 24.8793, longitude: 67.0658 },
    type: "area",
  },
  {
    id: "10",
    name: "Nursery",
    address: "Nursery, Shahrah-e-Faisal, Karachi, Pakistan",
    coordinates: { latitude: 24.8823, longitude: 67.0688 },
    type: "area",
  },
  {
    id: "11",
    name: "Dolmen Mall",
    address: "Dolmen Mall Clifton, Karachi, Pakistan",
    coordinates: { latitude: 24.8138, longitude: 67.0271 },
    type: "landmark",
  },
  {
    id: "12",
    name: "Numaish Chowrangi",
    address: "Numaish Chowrangi, Karachi, Pakistan",
    coordinates: { latitude: 24.8752, longitude: 67.0483 },
    type: "landmark",
  },
  {
    id: "13",
    name: "University Road",
    address: "University Road, Karachi, Pakistan",
    coordinates: { latitude: 24.9406, longitude: 67.1179 },
    type: "address",
  },
  {
    id: "14",
    name: "Tariq Road",
    address: "Tariq Road, PECHS, Karachi, Pakistan",
    coordinates: { latitude: 24.8715, longitude: 67.0624 },
    type: "address",
  },
  {
    id: "15",
    name: "Malir",
    address: "Malir, Karachi, Pakistan",
    coordinates: { latitude: 24.9437, longitude: 67.2091 },
    type: "city",
  },
];

/**
 * Search locations based on query string
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 5)
 * @returns Promise with array of location suggestions
 */
export const searchLocations = async (
  query: string,
  limit: number = 5
): Promise<LocationSuggestion[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();

  // Filter locations based on query
  const results = MOCK_LOCATIONS.filter(
    (location) =>
      location.name.toLowerCase().includes(searchTerm) ||
      location.address.toLowerCase().includes(searchTerm)
  );

  // Sort by relevance (exact match first, then starts with, then contains)
  results.sort((a, b) => {
    const aNameLower = a.name.toLowerCase();
    const bNameLower = b.name.toLowerCase();

    // Exact match
    if (aNameLower === searchTerm) return -1;
    if (bNameLower === searchTerm) return 1;

    // Starts with
    if (aNameLower.startsWith(searchTerm) && !bNameLower.startsWith(searchTerm))
      return -1;
    if (bNameLower.startsWith(searchTerm) && !aNameLower.startsWith(searchTerm))
      return 1;

    // Alphabetical
    return aNameLower.localeCompare(bNameLower);
  });

  return results.slice(0, limit);
};

/**
 * Get popular locations (for empty search state)
 * @param limit - Maximum number of results (default: 5)
 * @returns Array of popular location suggestions
 */
export const getPopularLocations = (
  limit: number = 5
): LocationSuggestion[] => {
  return MOCK_LOCATIONS.filter((loc) => loc.type === "landmark").slice(
    0,
    limit
  );
};

/**
 * Get location by ID
 * @param id - Location ID
 * @returns Location suggestion or null if not found
 */
export const getLocationById = (id: string): LocationSuggestion | null => {
  return MOCK_LOCATIONS.find((loc) => loc.id === id) || null;
};
