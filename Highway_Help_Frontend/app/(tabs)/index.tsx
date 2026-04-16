import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HelperScreen from "../screens/HelperScreen";
import UserScreen from "../screens/UserScreen";

interface StoredUser {
  id: number;
  role: "user" | "helper";
}

export default function HomeScreen() {
  const [role, setRole] = useState<"user" | "helper" | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const raw = await AsyncStorage.getItem("app_user");
      if (!raw) return;

      const user: StoredUser = JSON.parse(raw);
      setRole(user.role);
    };

    loadUser();
  }, []);

  if (!role) {
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

  return role === "helper" ? <HelperScreen /> : <UserScreen />;
}
