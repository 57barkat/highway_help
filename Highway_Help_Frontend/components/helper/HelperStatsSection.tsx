import React from "react";
import { View, StyleSheet } from "react-native";
import { StatItem } from "../../components/helper/HelperSubComponents";

interface Props {
  userLocation: any;
  jobStage: string;
  stats: any;
  isProfile?: boolean;
}

export default function HelperStatsSection({
  userLocation,
  jobStage,
  stats,
  isProfile = false,
}: Props) {
  if (!isProfile && (userLocation || jobStage !== "idle")) return null;

  return (
    <View
      style={[
        styles.container,
        isProfile ? styles.profileIntegration : styles.floatingMapStyle,
      ]}
    >
      <StatItem
        icon="star"
        color="#F59E0B"
        value={stats.rating ? stats.rating.toFixed(1) : "0.0"}
        label="Rating"
      />
      <View style={styles.divider} />
      <StatItem
        icon="wallet"
        color="#10B981"
        value={`Rs ${stats.earnings || 0}`}
        label="Earnings"
      />
      <View style={styles.divider} />
      <StatItem
        icon="grid"
        color="#2D5AF0"
        value={stats.count || 0}
        label="Jobs"
      />
      <View style={styles.divider} />
      <StatItem
        icon="alert-circle"
        color="#EF4444"
        value={`Rs ${stats.availableBalance || 0}`}
        label=" Balance"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 18,
    backgroundColor: "#FFFFFF",
  },
  floatingMapStyle: {
    marginHorizontal: 15,
    borderRadius: 24,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileIntegration: {
    backgroundColor: "transparent",
  },
  divider: {
    width: 1,
    height: "50%",
    backgroundColor: "#F1F5F9",
  },
});
