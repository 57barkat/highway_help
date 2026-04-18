import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import api from "../api/api";
import { router } from "expo-router";
import { StatusModal } from "@/models/StatusModal";
import { persistSession } from "@/lib/auth-storage";
import { useTheme } from "@/context/theme";
import { uiRadii, uiShadows, uiSpacing } from "@/lib/ui/system";

export default function SignInScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) => {
    setModalConfig({ visible: true, title, message, type });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return showModal("Hold on", "Please fill in all fields.", "warning");
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { accessToken, refreshToken, user } = res.data;

      await persistSession(accessToken, user, refreshToken);
      router.replace("/(tabs)");
    } catch (err) {
      showModal(
        "Login failed",
        "Invalid credentials. Double-check your email and password.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
            Highway Help
          </Text>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Welcome back
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.text.secondary }]}
          >
            Sign in to manage live rescue activity with a cleaner, faster mobile
            workspace.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.colors.text.primary }]}>
            Email Address
          </Text>
          <TextInput
            placeholder="name@example.com"
            placeholderTextColor={theme.colors.input.placeholder}
            value={email}
            onChangeText={setEmail}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text.primary,
              },
            ]}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.label, { color: theme.colors.text.primary }]}>
            Password
          </Text>
          <TextInput
            placeholder="Password"
            placeholderTextColor={theme.colors.input.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text.primary,
              },
            ]}
          />

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: theme.colors.primary },
              loading && styles.disabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.signupLink,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => router.push("./SignUpScreen")}
          >
            <Text
              style={[styles.signupText, { color: theme.colors.text.secondary }]}
            >
              Need an account?
            </Text>
            <Text
              style={[styles.signupHighlight, { color: theme.colors.primary }]}
            >
              Create one now
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {modalConfig ? (
        <StatusModal
          visible={modalConfig.visible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={() => setModalConfig(null)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  panel: {
    borderWidth: 1,
    borderRadius: uiRadii.xxl,
    padding: uiSpacing.xl,
    ...uiShadows.card,
  },
  header: { marginBottom: 36 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  title: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  form: { width: "100%" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    fontSize: 16,
  },
  loginButton: {
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    ...uiShadows.soft,
  },
  disabled: { opacity: 0.7 },
  buttonText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  signupLink: {
    marginTop: 24,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: uiRadii.lg,
    paddingVertical: 14,
  },
  signupText: {
    fontSize: 13,
    fontWeight: "600",
  },
  signupHighlight: {
    marginTop: 4,
    fontWeight: "700",
  },
});
