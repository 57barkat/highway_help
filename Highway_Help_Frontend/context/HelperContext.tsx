import {
  useHelperJob,
  JobStage,
  Request,
  LatLng,
} from "@/app/hooks/useHelperJob";
import React, { createContext, useContext } from "react";

interface HelperContextType {
  online: boolean;
  helperLocation: LatLng | null;
  userLocation: LatLng | null;
  incomingRequests: Request[];
  jobStage: JobStage;
  modalConfig: {
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null;
  setModalConfig: React.Dispatch<
    React.SetStateAction<{
      visible: boolean;
      title: string;
      message: string;
      type: "success" | "error" | "info" | "warning";
    } | null>
  >;
  stats: {
    rating: number;
    earnings: number;
    count: number;
    availableBalance: number;
  };
  toggleOnline: () => Promise<void>;
  sendOffer: (requestId: number, price: number) => Promise<boolean>;
  agreedPrice: number;
  cancelRide: () => Promise<void>;
  markArrived: () => Promise<boolean | undefined>;
  startWork: () => Promise<boolean | undefined>;
  completeWork: (
    finalPrice: number,
    minPrice: number,
  ) => Promise<boolean | undefined>;
}

const HelperContext = createContext<HelperContextType | null>(null);

export const HelperProvider = ({ children }: { children: React.ReactNode }) => {
  const helperData = useHelperJob();
  return (
    <HelperContext.Provider value={helperData}>
      {children}
    </HelperContext.Provider>
  );
};

export const useHelper = () => {
  const context = useContext(HelperContext);
  if (!context) {
    throw new Error("useHelper must be used within a HelperProvider");
  }
  return context;
};
