import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionButton } from "../../components/helper/HelperSubComponents";
import { useTheme } from "@/context/theme";
import { uiRadii, uiSpacing } from "@/lib/ui/system";

interface Props {
  jobStage: string;
  markArrived: () => void;
  startWork: () => void;
  setShowPriceModal: (v: boolean) => void;
  cancelRide: () => void;
}

const HelperWorkflowSection = ({
  jobStage,
  markArrived,
  startWork,
  setShowPriceModal,
  cancelRide,
}: Props) => {
  const { theme } = useTheme();

  if (jobStage === "idle") return null;

  const stages = ["navigating", "arrived", "working"];
  const currentStep = stages.indexOf(jobStage);

  return (
    <View
      style={[localStyles.container, { backgroundColor: theme.colors.card }]}
    >
      <View
        style={[localStyles.handle, { backgroundColor: theme.colors.border }]}
      />

      <View style={localStyles.progressRow}>
        {stages.map((_, index) => (
          <View
            key={index}
            style={[
              localStyles.progressBar,
              {
                backgroundColor:
                  index <= currentStep
                    ? theme.colors.primary
                    : theme.isDark
                      ? "#334155"
                      : "#E2E8F0",
              },
            ]}
          />
        ))}
      </View>

      <View style={localStyles.content}>
        {jobStage === "navigating" && (
          <View>
            <Text style={localStyles.stepText}>STEP 1: HEAD TO CLIENT</Text>
            <ActionButton
              label="I HAVE ARRIVED"
              onPress={markArrived}
              icon="location"
              color={theme.colors.primary}
            />
          </View>
        )}

        {jobStage === "arrived" && (
          <View>
            <Text style={localStyles.stepText}>STEP 2: START SERVICE</Text>
            <ActionButton
              label="START WORKING"
              onPress={startWork}
              icon="play"
              color="#8B5CF6" // Purple stands out for "Action"
            />
          </View>
        )}

        {jobStage === "working" && (
          <View>
            <Text style={localStyles.stepText}>FINAL STEP: PAYMENT</Text>
            <ActionButton
              label="MARK AS FINISHED"
              onPress={() => setShowPriceModal(true)}
              icon="checkmark-done"
              color={theme.colors.success || "#10B981"}
            />
          </View>
        )}
      </View>

      {jobStage !== "working" && (
        <TouchableOpacity
          onPress={cancelRide}
          style={localStyles.cancelBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close-circle-outline"
            size={16}
            color={theme.colors.error || "#F43F5E"}
          />
          <Text
            style={[
              localStyles.cancelText,
              { color: theme.colors.error || "#F43F5E" },
            ]}
          >
            CANCEL RIDE
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: uiSpacing.xl,
    paddingBottom: 40,
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handle: {
    width: 45,
    height: 5,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 25,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 30,
  },
  progressBar: {
    height: 6,
    width: 70,
    borderRadius: 3,
  },
  content: {
    marginBottom: 10,
  },
  stepText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  cancelBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    padding: 12,
  },
  cancelText: {
    fontWeight: "800",
    fontSize: 12,
    marginLeft: 6,
    letterSpacing: 1,
  },
});

export default HelperWorkflowSection;
