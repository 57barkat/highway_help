import { useFonts } from "expo-font";
import { Text, View, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";

import { ThemeProvider } from "../context/theme";
import SplashScreen from "../components/splash-screen";
import * as SplashScreenExpo from "expo-splash-screen";
import { AuthProvider, useAuth } from "../context/auth";
import "../context/i18n";
import { HelperProvider } from "@/context/HelperContext";

// Prevent auto-hide of splash screen
SplashScreenExpo.preventAutoHideAsync().catch(() => {});

const RootLayoutContent = () => {
  const { isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    "Montserrat-Bold": require("../assets/fonts/Montserrat-Bold.ttf"),
    "Montserrat-Regular": require("../assets/fonts/Montserrat-Regular.ttf"),
    "Montserrat-Medium": require("../assets/fonts/Montserrat-Medium.ttf"),
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      const hideNavBar = async () => {
        try {
          await NavigationBar.setBehaviorAsync("sticky-immersive" as any);
          await NavigationBar.setVisibilityAsync("hidden");
        } catch (error) {
          console.warn("NavigationBar failed to hide:", error);
        }
      };
      hideNavBar();
    }

    if (fontsLoaded || fontError) {
      SplashScreenExpo.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (!fontsLoaded && !fontError) return null;

  if (showSplash) return <SplashScreen onFinish={handleSplashFinish} />;

  if (isLoading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );

  return (
    <>
      <StatusBar hidden={true} />
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
};

const RootLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <HelperProvider>
            <RootLayoutContent />
          </HelperProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
