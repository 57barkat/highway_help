import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userId = await AsyncStorage.getItem("app_token");

        if (userId) {
          // Navigate to tabs root (remove parentheses)
          router.replace("/(tabs)");
        } else {
          // Navigate to login/phone auth
          router.replace("/SignInScreen");
        }
      } catch (err) {
        console.log("Error checking auth:", err);
        router.replace("/SignInScreen");
      }
    };

    checkAuth();
  }, []);

  return null; // no UI needed, just redirect
}
