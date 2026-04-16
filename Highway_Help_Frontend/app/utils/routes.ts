import { decodePolyline } from "./polyline";

const GOOGLE_API_KEY =
  "pk.eyJ1IjoiNTctYmFya2F0IiwiYSI6ImNtaHl4cmdmcTAzc3kyaXB5ZTJuMmcweHYifQ._bBUYtg5915x9TsUVX_X8A";

export const fetchRoute = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.routes?.length) return [];
    return decodePolyline(json.routes[0].overview_polyline.points);
  } catch {
    return [];
  }
};
