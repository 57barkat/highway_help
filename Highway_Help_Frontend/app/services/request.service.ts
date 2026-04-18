import { API_URL } from "@/lib/runtime";
import { authFetch } from "@/lib/auth-client";

export interface CreateRequestPayload {
  description: string;
  problemType: string;
  lat?: number;
  lng?: number;
}

export const RequestService = {
  async createRequest(payload: CreateRequestPayload) {
    const response = await authFetch(`${API_URL}/request/create`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to create request");
    }

    return response.json();
  },

  async acceptOffer(offerId: number) {
    const response = await authFetch(`${API_URL}/request/offer/accept`, {
      method: "POST",
      body: JSON.stringify({ offerId }),
    });

    if (!response.ok) {
      throw new Error("Failed to accept offer");
    }

    return response.json();
  },

  async submitRating(requestId: number, rating: number) {
    const response = await authFetch(`${API_URL}/request/user/rate`, {
      method: "POST",
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
