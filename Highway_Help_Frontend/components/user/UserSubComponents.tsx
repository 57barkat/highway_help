import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/theme";
import { uiRadii } from "@/lib/ui/system";

export const UserMarker = () => {
  const { theme } = useTheme();
  return (
    <View style={styles.markerContainer}>
      <View
        style={[
          styles.userPulse,
          { backgroundColor: theme.colors.primary, opacity: 0.2 },
        ]}
      />
      <View style={[styles.userDotOuter, { backgroundColor: "#FFF" }]}>
        <View
          style={[
            styles.userDotInner,
            { backgroundColor: theme.colors.primary },
          ]}
        />
      </View>
    </View>
  );
};

export const MechanicMarker = () => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.mechanicContainer,
        {
          backgroundColor: theme.isDark
            ? theme.colors.primary
            : theme.colors.text.primary,
          borderColor: "#FFF",
        },
      ]}
    >
      <MaterialCommunityIcons name="moped" size={24} color="#FFF" />
      <View
        style={[
          styles.triangle,
          {
            borderTopColor: theme.isDark
              ? theme.colors.primary
              : theme.colors.text.primary,
          },
        ]}
      />
    </View>
  );
};

interface RatingProps {
  visible: boolean;
  ratingValue: number;
  onRate: (val: number) => void;
  onSubmit: (val: number) => void;
}

export const RatingOverlay = ({
  visible,
  ratingValue,
  onRate,
  onSubmit,
}: RatingProps) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.overlayWrapper}>
      <View style={[styles.ratingCard, { backgroundColor: theme.colors.card }]}>
        <View
          style={[
            styles.successIconCircle,
            {
              backgroundColor: theme.colors.success || "#10B981",
              shadowColor: theme.colors.success,
            },
          ]}
        >
          <Ionicons name="checkmark-done" size={44} color="#FFF" />
        </View>

        <Text
          style={[styles.completedTitle, { color: theme.colors.text.primary }]}
        >
          Job Completed!
        </Text>
        <Text
          style={[styles.completedSub, { color: theme.colors.text.secondary }]}
        >
          Your vehicle is safe now.{"\n"}How was your experience with the
          helper?
        </Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRate(i);
              }}
              style={styles.starTouch}
            >
              <Ionicons
                name={i <= ratingValue ? "star" : "star-outline"}
                size={42}
                color={i <= ratingValue ? "#FFB800" : theme.colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor:
                ratingValue === 0 ? theme.colors.border : theme.colors.primary,
            },
          ]}
          disabled={ratingValue === 0}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSubmit(ratingValue);
          }}
        >
          <Text
            style={[
              styles.submitBtnText,
              {
                color: ratingValue === 0 ? theme.colors.text.secondary : "#FFF",
              },
            ]}
          >
            Submit Feedback
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: { alignItems: "center", justifyContent: "center" },
  userPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "absolute",
  },
  userDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  userDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  mechanicContainer: {
    padding: 8,
    borderRadius: 14,
    borderWidth: 2,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  triangle: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  overlayWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 1000,
  },
  ratingCard: {
    width: "100%",
    borderRadius: 32,
    padding: 30,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  completedSub: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  starRow: { flexDirection: "row", marginBottom: 35 },
  starTouch: { marginHorizontal: 4 },
  submitBtn: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
  },
  submitBtnText: {
    fontWeight: "800",
    fontSize: 16,
  },
});
