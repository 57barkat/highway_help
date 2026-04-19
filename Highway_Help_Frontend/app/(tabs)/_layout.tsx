import { Redirect, Slot } from "expo-router";
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/theme";

export default function TabLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/SignInScreen" />;
  }

  return <Slot />;
}
