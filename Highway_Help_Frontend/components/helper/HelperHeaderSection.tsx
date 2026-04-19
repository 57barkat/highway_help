import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { OnlineSlider } from "@/components/helper/OnlineSlider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/theme";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  online: boolean;
  toggleOnline: () => void;
  disabled?: boolean;
  loading?: boolean;
  statusText?: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function HelperHeaderSection({
  online,
  toggleOnline,
  disabled = false,
  loading = false,
  statusText,
  collapsed = false,
  onToggleCollapsed,
}: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (collapsed) {
    return (
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top * 0.35, 6),
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onToggleCollapsed}
          style={[
            localStyles.compactShell,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={localStyles.compactLeft}>
            <View
              style={[
                localStyles.compactBadge,
                {
                  backgroundColor: online
                    ? "rgba(16,185,129,0.16)"
                    : "rgba(100,116,139,0.14)",
                },
              ]}
            >
              <View
                style={[
                  localStyles.compactDot,
                  { backgroundColor: online ? "#10B981" : "#64748B" },
                ]}
              />
              <Text
                style={[
                  localStyles.compactBadgeText,
                  { color: online ? "#10B981" : theme.colors.text.secondary },
                ]}
              >
                {online ? "ONLINE" : "OFFLINE"}
              </Text>
            </View>
            <View style={localStyles.compactCopy}>
              <Text
                style={[
                  localStyles.compactTitle,
                  { color: theme.colors.text.primary },
                ]}
              >
                Helper Availability
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  localStyles.compactSubtitle,
                  { color: theme.colors.text.secondary },
                ]}
              >
                {statusText || "Tap to expand controls"}
              </Text>
            </View>
          </View>

          <View style={localStyles.compactRight}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={theme.colors.text.secondary}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: Math.max(insets.top * 0.35, 6),
        paddingBottom: 10,
      }}
    >
      <View style={localStyles.headerRow}>
        <View style={localStyles.headerCopy}>
          <Text style={[localStyles.title, { color: theme.colors.text.primary }]}>
            Helper Availability
          </Text>
          <Text
            style={[localStyles.subtitle, { color: theme.colors.text.secondary }]}
          >
            We'll enable online mode as soon as location and realtime sync are ready.
          </Text>
        </View>
        {online ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onToggleCollapsed}
            style={[
              localStyles.collapseButton,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Ionicons
              name="chevron-up"
              size={18}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={localStyles.sliderShadowWrapper}>
        <OnlineSlider
          online={online}
          onToggle={toggleOnline}
          disabled={disabled}
          loading={loading}
          statusText={statusText}
        />
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    alignSelf: "flex-start",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    alignSelf: "flex-start",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  collapseButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
  compactShell: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 12,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  compactBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  compactCopy: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  compactRight: {
    marginLeft: 12,
  },
});
