import { IconLibrary } from "@/components/icon-symbol";

export type ServiceType =
  | "flat_tire"
  | "fuel"
  | "battery"
  | "tow"
  | "lockout"
  | "other";

export type AppMode = "user" | "helper" | "admin";

export type TabBarItem = {
  name: string;
  route: string;
  icon: import("@/components/icon-symbol").IconSymbolName;
  label: string;
};

export const SERVICE_TYPES: {
  [key in ServiceType]: { label: string; icon: string; library: IconLibrary };
} = {
  flat_tire: {
    label: "Flat Tire",
    icon: "tire",
    library: "MaterialCommunityIcons",
  },
  fuel: {
    label: "Fuel Delivery",
    icon: "oil-can",
    library: "FontAwesome5",
  },
  battery: {
    label: "Battery Jump",
    icon: "battery-dead",
    library: "Ionicons",
  },
  tow: {
    label: "Towing",
    icon: "truck",
    library: "MaterialCommunityIcons",
  },
  lockout: {
    label: "Car Lockout",
    icon: "key",
    library: "MaterialCommunityIcons",
  },
  other: {
    label: "Other",
    icon: "wrench",
    library: "MaterialCommunityIcons",
  },
};
