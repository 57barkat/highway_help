import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    router.replace(isAuthenticated ? "/(tabs)" : "/SignInScreen");
  }, [isAuthenticated, isLoading, router]);

  return null;
}
