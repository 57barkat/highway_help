import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/app/constants/Colors";

interface OnlineSliderProps {
  online: boolean;
  onToggle: () => void;
}

export const OnlineSlider = ({ online, onToggle }: OnlineSliderProps) => {
  const animatedValue = useRef(new Animated.Value(online ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: online ? 1 : 0,
      useNativeDriver: false, // Color and Layout animations need false
      friction: 8, // Slightly more "bouncy"
      tension: 40,
    }).start();
  }, [online]);

  const handlePress = () => {
    // Light impact feels more premium for a toggle than "Heavy"
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 70], // Adjusted for better centering
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#1E293B", "#10B981"], // Deep slate to a vibrant emerald
  });

  // Smoothly fade the text in and out
  const onlineOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const offlineOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        style={styles.touchArea}
      >
        <Animated.View style={[styles.container, { backgroundColor }]}>
          <View style={styles.textTrack}>
            <Animated.Text
              style={[
                styles.label,
                { opacity: offlineOpacity, marginLeft: 45 },
              ]}
            >
              OFFLINE
            </Animated.Text>
            <Animated.Text
              style={[
                styles.label,
                { opacity: onlineOpacity, marginRight: 45 },
              ]}
            >
              ONLINE
            </Animated.Text>
          </View>

          <Animated.View
            style={[styles.thumb, { transform: [{ translateX }] }]}
          >
            <Ionicons
              name={online ? "flashlight" : "moon"}
              size={20}
              color={online ? "#10B981" : "#64748B"}
            />
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.subHint}>
        {online ? "Visible to customers" : "Tap to start receiving jobs"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  touchArea: {
    borderRadius: 100,
  },
  container: {
    width: 120,
    height: 54, // Slightly taller for better touch target
    borderRadius: 100,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  textTrack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    position: "absolute",
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.2,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
    // Modern "Elevated" Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  subHint: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 12,
    letterSpacing: 0.3,
  },
});
