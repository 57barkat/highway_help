export interface Helper {
  socketId: string;
  userId: number;
  lat: number;
  lng: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface StoredUser {
  id: number;
  role: "user" | "helper";
}

export interface Offer {
  offerId: number;
  requestId: number;
  mechanicId: number;
  offeredPrice: number;
}
