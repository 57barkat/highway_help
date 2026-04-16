import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/app/constants/Colors";

export const UserMarker = () => (
  <View style={{ alignItems: "center", justifyContent: "center" }}>
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        opacity: 0.2,
        position: "absolute",
      }}
    />
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: Colors.primary,
        }}
      />
    </View>
  </View>
);

export const MechanicMarker = () => (
  <View
    style={{
      backgroundColor: Colors.textMain,
      padding: 8,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: Colors.white,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 6,
    }}
  >
    <MaterialCommunityIcons name="moped" size={24} color={Colors.white} />
    <View
      style={{
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
        borderTopColor: Colors.textMain,
      }}
    />
  </View>
);

export const RatingOverlay = ({
  visible,
  ratingValue,
  onRate,
  onSubmit,
}: any) => {
  if (!visible) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: Colors.white,
          width: "100%",
          borderRadius: 32,
          padding: 30,
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 15,
          elevation: 10,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: Colors.success,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
            shadowColor: Colors.success,
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <Ionicons name="checkmark-done" size={44} color={Colors.white} />
        </View>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "900",
            color: Colors.textMain,
            marginBottom: 8,
          }}
        >
          Job Completed!
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: Colors.textSub,
            textAlign: "center",
            marginBottom: 25,
            lineHeight: 22,
          }}
        >
          Your vehicle is safe now.{"\n"}How was your experience with the
          helper?
        </Text>

        <View style={{ flexDirection: "row", marginBottom: 35 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRate(i);
              }}
              style={{ marginHorizontal: 4 }}
            >
              <Ionicons
                name={i <= ratingValue ? "star" : "star-outline"}
                size={42}
                color={i <= ratingValue ? "#FFB800" : "#E9ECEF"}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor:
              ratingValue === 0 ? Colors.border : Colors.textMain,
            width: "100%",
            paddingVertical: 18,
            borderRadius: 20,
            alignItems: "center",
          }}
          disabled={ratingValue === 0}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSubmit(ratingValue);
          }}
        >
          <Text
            style={{
              color: ratingValue === 0 ? Colors.textSub : Colors.white,
              fontWeight: "800",
              fontSize: 16,
            }}
          >
            Submit Feedback
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
