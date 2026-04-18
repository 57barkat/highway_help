import React, { useState, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Text,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "@/api/api";
import { StatusModal } from "@/models/StatusModal";
import { useTheme } from "@/context/theme";
import { uiRadii, uiShadows, uiSpacing } from "@/lib/ui/system";

export default function PaymentScreen() {
  const { amount } = useLocalSearchParams();
  const { theme } = useTheme();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [tracker, setTracker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
    redirectToProfile?: boolean;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post("/payments/safepay-init", {
          amount: Number(amount),
        });

        setTracker(data.tracker);
        setCheckoutUrl(data.url);
      } catch (e: any) {
        setModalConfig({
          visible: true,
          title: "Payment unavailable",
          message: "We could not connect to the payment server right now.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [amount]);

  const checkStatus = async () => {
    try {
      const { data } = await api.get(`/payments/status/${tracker}`);
      if (data.status === "SUCCESS") {
        setModalConfig({
          visible: true,
          title: "Wallet updated",
          message: "Your top-up completed successfully.",
          type: "success",
          redirectToProfile: true,
        });
      } else {
        setModalConfig({
          visible: true,
          title: "Payment processing",
          message: "Your payment is still being processed. We'll refresh your wallet shortly.",
          type: "info",
          redirectToProfile: true,
        });
      }
    } catch (e) {
      router.replace("/(tabs)/profile");
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.headerCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Secure Checkout
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          Complete your wallet top-up without leaving the app.
        </Text>
      </View>

      {checkoutUrl ? (
        <View style={[styles.webCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <WebView
            source={{
              uri: checkoutUrl,
              headers: { "ngrok-skip-browser-warning": "true" },
            }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            scalesPageToFit
            setSupportMultipleWindows={false}
            allowsInlineMediaPlayback
            userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
            onNavigationStateChange={(nav) => {
              const isCheckoutPage = nav.url.includes("checkout/pay");
              const isSuccess =
                nav.url.includes("payment-success") ||
                nav.url.includes("highwayhelp://");

              if (!isCheckoutPage && isSuccess && !verified) {
                setVerified(true);
                setTimeout(checkStatus, 3000);
              }
            }}
            renderLoading={() => (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
          />
        </View>
      ) : null}

      {modalConfig ? (
        <StatusModal
          visible={modalConfig.visible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={() => {
            const shouldRedirect = modalConfig.redirectToProfile;
            setModalConfig(null);
            if (shouldRedirect) {
              router.replace("/(tabs)/profile");
            } else if (!checkoutUrl) {
              router.back();
            }
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: uiSpacing.md,
    gap: uiSpacing.md,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: uiRadii.xl,
    padding: uiSpacing.lg,
    ...uiShadows.soft,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  webCard: {
    flex: 1,
    overflow: "hidden",
    borderRadius: uiRadii.xl,
    borderWidth: 1,
    ...uiShadows.card,
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
