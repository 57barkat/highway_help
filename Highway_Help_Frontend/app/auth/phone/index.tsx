import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Phone } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { httpClient } from "@/lib/http";
import { useTheme } from "@/context/theme";
import AppButton from "@/components/app-button";

export default function PhoneScreen() {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      // Always send in +92 format
      const formattedPhone = `+92${phoneNumber.trim()}`;

      await httpClient.post("/otp/send", { phone: formattedPhone });
      router.push({
        pathname: "/auth/verify-OTP",
        params: { phoneNumber: formattedPhone },
      });
    } catch (error: any) {
      console.log("🚀 ~ handleSendOTP ~ error:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View id="recaptcha-container" />
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: theme.isDark
                    ? "rgba(131, 50, 245, 0.15)"
                    : "rgba(131, 50, 245, 0.1)",
                },
              ]}
            >
              <Phone size={32} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                styles.title,
                {
                  fontFamily: "Montserrat-Bold",
                  color: theme.colors.text.primary,
                },
              ]}
            >
              Enter Your Number
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  fontFamily: "Montserrat-Regular",
                  color: theme.colors.text.secondary,
                },
              ]}
            >
              We'll send you a verification code
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text
              style={[
                styles.label,
                {
                  fontFamily: "Montserrat-SemiBold",
                  color: theme.colors.text.primary,
                },
              ]}
            >
              Phone Number
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.colors.input.background,
                  borderColor: theme.colors.input.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.countryCode,
                  {
                    fontFamily: "Montserrat-SemiBold",
                    color: theme.colors.text.primary,
                  },
                ]}
              >
                +92
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    fontFamily: "Montserrat-Regular",
                    color: theme.colors.text.primary,
                  },
                ]}
                placeholder="300 123 4567"
                placeholderTextColor={theme.colors.input.placeholder}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.spacer} />
          <AppButton
            title="Continue"
            onPress={handleSendOTP}
            variant="primary"
            size="large"
            loading={loading}
            disabled={phoneNumber.length !== 10 || loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  header: { marginBottom: 48 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 28, marginBottom: 8 },
  subtitle: { fontSize: 16 },
  inputSection: { marginBottom: 32 },
  label: { fontSize: 14, marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  countryCode: { fontSize: 16, marginRight: 12 },
  input: { flex: 1, fontSize: 16, paddingVertical: 16 },
  spacer: { flex: 1 },
});
