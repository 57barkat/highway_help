import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ActionButton } from "../../components/helper/HelperSubComponents";
import { Colors } from "@/app/constants/Colors";

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
  if (jobStage === "idle") return null;

  const stages = ["navigating", "arrived", "working"];
  const currentStep = stages.indexOf(jobStage);

  return (
    <View style={localStyles.container}>
      <View style={localStyles.handle} />

      <View style={localStyles.progressRow}>
        {stages.map((_, index) => (
          <View
            key={index}
            style={[
              localStyles.progressBar,
              {
                backgroundColor:
                  index <= currentStep ? Colors.primary : "#E2E8F0",
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
              color={Colors.primary}
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
              color="#8B5CF6"
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
              color={Colors.success}
            />
          </View>
        )}
      </View>

      {jobStage !== "working" && (
        <TouchableOpacity onPress={cancelRide} style={localStyles.cancelBtn}>
          <Ionicons
            name="close-circle-outline"
            size={16}
            color={Colors.danger}
          />
          <Text style={localStyles.cancelText}>CANCEL RIDE</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 25,
  },
  progressBar: { height: 4, width: 60, borderRadius: 2 },
  content: { marginBottom: 15 },
  stepText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 15,
    letterSpacing: 1.5,
  },
  cancelBtn: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    padding: 10,
  },
  cancelText: {
    color: Colors.danger,
    fontWeight: "800",
    fontSize: 11,
    marginLeft: 5,
    letterSpacing: 1,
  },
});

export default HelperWorkflowSection;
