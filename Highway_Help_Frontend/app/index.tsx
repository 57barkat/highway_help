import { useEffect } from "react";
import { useRouter } from "expo-router";
import { getStoredUser } from "@/lib/auth-storage";
import { getValidAccessToken } from "@/lib/auth-client";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getValidAccessToken();
        const user = await getStoredUser();

        if (token && user) {
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
