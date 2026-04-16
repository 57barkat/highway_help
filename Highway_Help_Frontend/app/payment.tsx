import React, { useState, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "@/api/api";

export default function PaymentScreen() {
  const { amount } = useLocalSearchParams();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [tracker, setTracker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      console.log("📱 [FRONTEND] Initializing for Amount:", amount);
      try {
        const { data } = await api.post("/payments/safepay-init", {
          amount: Number(amount),
        });

        console.log("📱 [FRONTEND] URL Received:", data.url);
        setTracker(data.tracker);
        setCheckoutUrl(data.url);
      } catch (e: any) {
        console.error("📱 [FRONTEND] API Error:", e.message);
        Alert.alert("Error", "Could not connect to payment server.");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const checkStatus = async () => {
    console.log("📱 [FRONTEND] Polling Status for:", tracker);
    try {
      const { data } = await api.get(`/payments/status/${tracker}`);
      if (data.status === "SUCCESS") {
        Alert.alert("Success", "Wallet topped up!");
      } else {
        Alert.alert("Notice", "Payment is being processed.");
      }
      router.replace("/(tabs)/profile");
    } catch (e) {
      router.replace("/(tabs)/profile");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00A99D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {checkoutUrl ? (
        <WebView
          source={{
            uri: checkoutUrl,
            headers: { "ngrok-skip-browser-warning": "true" },
          }}
          // --- CRITICAL WEBVIEW FIXES ---
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          setSupportMultipleWindows={false}
          allowsInlineMediaPlayback={true}
          // Using a standard Chrome UserAgent to avoid bot detection
          userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
          onNavigationStateChange={(nav) => {
            console.log("🌐 [WEBVIEW] Navigating:", nav.url);

            const isCheckoutPage = nav.url.includes("checkout/pay");
            const isSuccess =
              nav.url.includes("payment-success") ||
              nav.url.includes("highwayhelp://");

            if (!isCheckoutPage && isSuccess && !verified) {
              console.log("🟣 [WEBVIEW] Success Detected!");
              setVerified(true);
              setTimeout(checkStatus, 3000);
            }
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("🌐 [WEBVIEW] HTTP Error: ", nativeEvent.statusCode);
          }}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#00A99D" />
            </View>
          )}
        />
      ) : (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#00A99D" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    position: "absolute",
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
});
