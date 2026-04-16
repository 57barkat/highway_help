import React from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./HelperStyles";

export const StatItem = ({ icon, color, value, label }: any) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const ActionButton = ({ label, onPress, color, icon }: any) => (
  <TouchableOpacity
    style={[styles.workflowBtn, { backgroundColor: color }]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={24} color="#fff" style={{ marginRight: 12 }} />
    <Text style={styles.workflowBtnText}>{label}</Text>
  </TouchableOpacity>
);

export const PulseIndicator = ({
  pulseAnim,
}: {
  pulseAnim: Animated.Value;
}) => (
  <View style={styles.pulseContainer}>
    <Animated.View
      style={[
        styles.pulseOuter,
        { transform: [{ scale: pulseAnim }], opacity: 0.3 },
      ]}
    />
    <View style={styles.pulseInner} />
  </View>
);
