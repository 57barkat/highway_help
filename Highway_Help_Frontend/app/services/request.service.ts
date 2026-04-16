import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.100.173:3000";

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("app_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export interface CreateRequestPayload {
  description: string;
  problemType: string;
  lat?: number;
  lng?: number;
}

export const RequestService = {
  async createRequest(payload: CreateRequestPayload) {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/request/create`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to create request");
    }

    return response.json();
  },

  async acceptOffer(offerId: number) {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/request/offer/accept`, {
      method: "POST",
      headers,
      body: JSON.stringify({ offerId }),
    });

    if (!response.ok) {
      throw new Error("Failed to accept offer");
    }

    return response.json();
  },

  async submitRating(requestId: number, rating: number) {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/request/rate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        requestId,
        rating,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit rating");
    }

    return response.json();
  },
};
