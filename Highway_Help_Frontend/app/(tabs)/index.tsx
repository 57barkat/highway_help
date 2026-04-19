import React from "react";
import { View, ActivityIndicator } from "react-native";
import HelperScreen from "../screens/HelperScreen";
import UserScreen from "../screens/UserScreen";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/auth";

export default function HomeScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/SignInScreen" />;
  }

  return user.role === "helper" ? <HelperScreen /> : <UserScreen />;
}
