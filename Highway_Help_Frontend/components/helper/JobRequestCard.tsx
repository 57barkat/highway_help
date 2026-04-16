import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { getDistanceInKm } from "@/lib/utils/getDistanceInKm ";
import { Colors } from "@/app/constants/Colors";
// import { Colors } from "./Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface JobRequestCardProps {
  item: any;
  helperLocation: any;
  onSendOffer: (requestId: number, price: number) => void;
  onDismiss: (id: number) => void;
}

export const JobRequestCard = ({
  item,
  helperLocation,
  onSendOffer,
  onDismiss,
}: JobRequestCardProps) => {
  const [price, setPrice] = useState("");
  const translateX = useSharedValue(0);
  const timerProgress = useSharedValue(1);

  useEffect(() => {
    const playAlert = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/sounds/notification.wav"),
        );
        await sound.playAsync();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.log("Audio Error", e);
      }
    };
    playAlert();

    timerProgress.value = withTiming(0, {
      duration: 45000,
      easing: Easing.linear,
    });

    const timer = setTimeout(() => {
      handleDismiss();
    }, 45000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    translateX.value = withTiming(SCREEN_WIDTH, { duration: 300 }, () => {
      runOnJS(onDismiss)(item.requestId);
    });
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        translateX.value = withTiming(
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
          { duration: 250 },
          () => runOnJS(onDismiss)(item.requestId),
        );
      } else {
        translateX.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: withTiming(translateX.value === 0 ? 1 : 0.7),
  }));

  const timerBarStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%`,
    backgroundColor: timerProgress.value < 0.3 ? Colors.danger : Colors.primary,
  }));

  const distance =
    helperLocation && item?.lat != null && item?.lng != null
      ? Number(
          getDistanceInKm(
            helperLocation.lat,
            helperLocation.lng,
            item.lat,
            item.lng,
          ) || 0,
        ).toFixed(1)
      : "0.0";

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            backgroundColor: Colors.white,
            borderRadius: 24,
            marginHorizontal: 16,
            marginVertical: 10,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: Colors.border,
            ...Platform.select({
              ios: {
                shadowColor: Colors.shadow,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 15,
              },
              android: { elevation: 8 },
            }),
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            height: 4,
            backgroundColor: Colors.primaryLight,
            width: "100%",
          }}
        >
          <Animated.View style={[{ height: "100%" }, timerBarStyle]} />
        </View>

        <View style={{ padding: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: Colors.primaryLight,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name="car-brake-alert"
                size={26}
                color={Colors.primary}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "900",
                  color: Colors.primary,
                  letterSpacing: 1,
                }}
              >
                {item.problemType?.toUpperCase() || "RESCUE NEEDED"}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 2,
                }}
              >
                <Feather name="map-pin" size={12} color={Colors.textSub} />
                <Text
                  style={{
                    fontSize: 13,
                    color: Colors.textSub,
                    marginLeft: 4,
                    fontWeight: "600",
                  }}
                >
                  {distance} km away
                </Text>
              </View>
            </View>

            <View
              style={{
                alignItems: "flex-end",
                backgroundColor: Colors.dangerLight,
                padding: 8,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: Colors.danger,
                  opacity: 0.8,
                }}
              >
                EST. PAY
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "900",
                  color: Colors.danger,
                }}
              >
                Rs {item.suggestedPrice}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 15,
              color: Colors.textMain,
              marginBottom: 20,
              lineHeight: 20,
              fontWeight: "500",
            }}
            numberOfLines={2}
          >
            {item.description ||
              "Roadside assistance requested. Check location and send your best offer."}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 16,
                paddingHorizontal: 15,
                height: 54,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: Colors.textSub,
                  fontWeight: "800",
                  marginRight: 6,
                }}
              >
                Rs
              </Text>
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 18,
                  color: Colors.textMain,
                  fontWeight: "900",
                }}
                placeholder={item.suggestedPrice?.toString()}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: Colors.textMain,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                height: 54,
                borderRadius: 16,
                shadowColor: Colors.textMain,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 5,
              }}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onSendOffer(
                  item.requestId,
                  parseFloat(price || item.suggestedPrice),
                );
              }}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontWeight: "800",
                  fontSize: 15,
                  marginRight: 8,
                }}
              >
                Send
              </Text>
              <Feather name="send" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};
