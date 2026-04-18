import React from "react";
import { View, StyleSheet } from "react-native";
import { OnlineSlider } from "@/components/helper/OnlineSlider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  online: boolean;
  toggleOnline: () => void;
}

export default function HelperHeaderSection({ online, toggleOnline }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: Math.max(insets.top * 0.2, 0),
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
