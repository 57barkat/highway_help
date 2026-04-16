import { useMemo } from "react";

export type JobStage = "idle" | "navigating" | "arrived" | "working";

export function useJobStageMachine(jobStage: JobStage) {
  return useMemo(() => {
    return {
      isIdle: jobStage === "idle",
      isNavigating: jobStage === "navigating",
      isArrived: jobStage === "arrived",
      isWorking: jobStage === "working",
      canCancel: jobStage === "navigating" || jobStage === "arrived",
    };
  }, [jobStage]);
}
