import { Tabs } from "expo-router";
import React from "react";
import {
  Car,
  Gift,
  Grid3x3,
  Headphones,
  Home,
  User,
} from "lucide-react-native";
import { useTheme } from "@/context/theme";

const TABS = [
  { name: "index", title: "Home", icon: Home },
  { name: "services", title: "Services", icon: Grid3x3 },
  { name: "rewards", title: "Rewards", icon: Gift },
  { name: "support", title: "Support", icon: Headphones },
  { name: "profile", title: "Profile", icon: User },
  { name: "rides", title: "Rides", icon: Car },
];

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderColor: "#E5E7EB",
          paddingTop: 4,
          height: 70,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#6B6B6B",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <tab.icon color={color} size={24} />,
          }}
        />
      ))}
    </Tabs>
  );
}
