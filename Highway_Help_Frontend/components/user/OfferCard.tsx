import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import {
  MaterialIcons,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  LinearTransition,
  interpolateColor,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { Colors } from "@/app/constants/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;

interface Offer {
  id: number;
  offeredPrice: number;
  distanceKm: number;
  helper: { name: string; rating: number; ratingCount: number; userId: number };
}

interface OfferCardProps {
  item: Offer;
  onAccept: (id: number) => void;
  onDismiss: (id: number) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  item,
  onAccept,
  onDismiss,
}) => {
  const { helper, offeredPrice, distanceKm, id } = item;
  const translateX = useSharedValue(0);
  const progressWidth = useSharedValue(100);

  useEffect(() => {
    const initCard = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/sounds/notification.wav"),
        );
        await sound.playAsync();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.log("Sound/Haptic error", e);
      }
    };
    initCard();

    // 45 second countdown for offer expiry
    progressWidth.value = withTiming(0, { duration: 45000 });
    const timer = setTimeout(() => dismissCard(), 45000);
    return () => clearTimeout(timer);
  }, []);

  const dismissCard = () => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 400 }, () => {
      runOnJS(onDismiss)(id);
    });
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const target = event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH;
        translateX.value = withTiming(target, {}, () => {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
          runOnJS(onDismiss)(id);
        });
      } else {
        translateX.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: 1 - Math.abs(translateX.value / SCREEN_WIDTH),
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
    backgroundColor: interpolateColor(
      progressWidth.value,
      [0, 20, 100],
      ["#EF4444", "#F59E0B", Colors.primary],
    ),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        layout={LinearTransition}
        style={[styles.cardContainer, animatedStyle]}
      >
        <View style={styles.cardContent}>
          {/* Avatar Section */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={30} color={Colors.primary} />
            </View>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={10} color="#FFD700" />
              <Text style={styles.ratingText}>
                {helper?.rating ? helper.rating.toFixed(1) : "5.0"}
              </Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.helperName} numberOfLines={1}>
              {helper?.name || "Rescue Partner"}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="map-marker-path"
                  size={14}
                  color="#6366F1"
                />
                <Text style={styles.metaText}>
                  {distanceKm?.toFixed(1) || "0.0"} km
                </Text>
              </View>
              <View style={styles.metaDivider} />
              <Text style={styles.metaText}>
                {helper?.ratingCount || 0} reviews
              </Text>
            </View>
          </View>

          {/* Price Section */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>OFFER</Text>
            <Text style={styles.priceValue}>Rs {offeredPrice}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onAccept(id);
          }}
          activeOpacity={0.9}
        >
          <Text style={styles.acceptBtnText}>Accept Offer</Text>
          <View style={styles.acceptBtnIcon}>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Countdown Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, progressBarStyle]} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  ratingBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  ratingText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
    marginLeft: 2,
  },
  infoSection: {
    flex: 1,
    marginLeft: 14,
  },
  helperName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginLeft: 4,
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 8,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#6366F1",
    letterSpacing: 1,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  acceptBtn: {
    backgroundColor: "#0F172A",
    height: 54,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 15,
    marginRight: 8,
  },
  acceptBtnIcon: {
    backgroundColor: "#FFF",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#F1F5F9",
  },
  progressBar: {
    height: "100%",
  },
});
