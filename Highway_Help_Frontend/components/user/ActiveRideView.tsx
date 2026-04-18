import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { styles } from "./UserStyles";
import { buildWhatsAppUrl } from "@/lib/utils";

export default function ActiveRideView({
  navigationData,
  cancelRide,
}: any) {
  const handleWhatsApp = async () => {
    const phoneNumber = navigationData?.helperPhoneNumber;
    if (!phoneNumber) {
      return;
    }

    const url = buildWhatsAppUrl(phoneNumber);
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={[styles.headerContent, { paddingBottom: 20 }]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#00C853",
                marginRight: 8,
              }}
            />
            <Text style={[styles.sheetTitle, { marginBottom: 0 }]}>
              Rescue in Progress
            </Text>
          </View>
          <Text style={styles.sheetSub}>Mechanic is on the way</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            cancelRide();
          }}
          style={{
            backgroundColor: "#FFF0F0",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FF3B30", fontWeight: "800", fontSize: 14 }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {navigationData && (
        <View style={{ gap: 10, marginTop: 15 }}>
          <View
            style={{
              backgroundColor: "#EEF4FF",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#2D5AF0", fontWeight: "700" }}>
              {navigationData.helperName
                ? `Assigned Helper: ${navigationData.helperName}`
                : "Helper assigned"}
            </Text>
          </View>
          {navigationData.helperPhoneNumber ? (
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={{
                backgroundColor: "#25D366",
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>
                Contact on WhatsApp
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}
