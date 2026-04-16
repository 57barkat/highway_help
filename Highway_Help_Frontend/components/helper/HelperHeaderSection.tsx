import React from "react";
import { View, StatusBar, Platform, StyleSheet } from "react-native";
import { OnlineSlider } from "@/components/helper/OnlineSlider";

interface Props {
  online: boolean;
  toggleOnline: () => void;
}

export default function HelperHeaderSection({ online, toggleOnline }: Props) {
  // We use top margin instead of absolute positioning
  const TOP_MARGIN =
    Platform.OS === "ios" ? 10 : (StatusBar.currentHeight || 0) + 10;

  return (
    <View
      style={{
        marginTop: TOP_MARGIN,
        marginBottom: 10,
        alignItems: "center",
        paddingHorizontal: 20,
      }}
    >
      <View style={localStyles.sliderShadowWrapper}>
        <OnlineSlider online={online} onToggle={toggleOnline} />
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  sliderShadowWrapper: {
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});
