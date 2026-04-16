import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ShieldCheck } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import { httpClient } from "@/lib/http";
import { useTheme } from "@/context/theme";
import { useAuth } from "@/context/auth";
import AppButton from "@/components/app-button";
import { formatPhoneNumber } from "@/lib/utils";

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const { setAuthenticated } = useAuth();
  const verifyingRef = useRef(false);

  const handleOtpChange = (text: string) => {
    setOtp(text);
    if (text.length === 6 && !verifyingRef.current) handleVerifyOTP();
  };

  const handleVerifyOTP = async () => {
    if (verifyingRef.current || otp.length !== 6) return;

    verifyingRef.current = true;
    setLoading(true);

    try {
      const phone = Array.isArray(params.phoneNumber)
        ? params.phoneNumber[0]
        : params.phoneNumber;

      // Ensure phone is in +92xxxxxxxxxx format
      const formattedPhone = phone.startsWith("+92") ? phone : `+92${phone}`;

      const { data } = await httpClient.post("/otp/verify", {
        phone: formattedPhone,
        code: otp,
      });

      // Store tokens individually
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);

      setAuthenticated(true);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.log(
        "🚀 ~ handleVerifyOTP ~ error:",
        error.response?.data || error
      );
      Alert.alert(
        "Error",
        error.response?.data?.message || "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
        }}
      >
        <View style={{ marginBottom: 48 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: theme.isDark
                ? "rgba(131, 50, 245, 0.15)"
                : "rgba(131, 50, 245, 0.1)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <ShieldCheck size={32} color={theme.colors.primary} />
          </View>
          <Text
            style={{
              fontFamily: "Montserrat-Bold",
              fontSize: 28,
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Verification Code
          </Text>
          <Text
            style={{
              fontFamily: "Montserrat-Regular",
              fontSize: 16,
              color: theme.colors.text.secondary,
            }}
          >
            Enter the 6-digit code sent to{"\n"}
            <Text style={{ fontFamily: "Montserrat-SemiBold" }}>
              +92 {formatPhoneNumber(params.phoneNumber)}
            </Text>
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <TextInput
            style={{
              fontFamily: "Montserrat-Bold",
              fontSize: 32,
              color: theme.colors.text.primary,
              textAlign: "center",
              backgroundColor: theme.colors.input.background,
              borderWidth: 1,
              borderColor: theme.colors.input.border,
              borderRadius: 8,
              paddingVertical: 20,
              letterSpacing: 16,
            }}
            placeholder="000000"
            placeholderTextColor={theme.colors.input.placeholder}
            keyboardType="number-pad"
            value={otp}
            onChangeText={handleOtpChange}
            maxLength={6}
          />
        </View>

        <View style={{ flex: 1 }} />
        <AppButton
          title="Verify"
          onPress={handleVerifyOTP}
          variant="primary"
          size="large"
          loading={loading}
          disabled={otp.length !== 6}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
