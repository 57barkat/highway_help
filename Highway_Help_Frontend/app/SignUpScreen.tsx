import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { StatusModal } from "@/models/StatusModal";
import { normalizePkPhoneNumber } from "@/lib/utils";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/theme";
import { uiRadii, uiShadows, uiSpacing } from "@/lib/ui/system";

const CATEGORIES = [
  { id: "flat_tire", label: "Flat Tire" },
  { id: "fuel", label: "Fuel Delivery" },
  { id: "battery", label: "Battery Jump" },
  { id: "tow", label: "Towing" },
];

export default function SignUp() {
  const { theme } = useTheme();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "helper">("user");
  const [categories, setCategories] = useState<string[]>([]);
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

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleSignUp = async () => {
    if (!name || !email || !phoneNumber || !password) {
      showModal("Missing info", "Please fill out all fields.", "warning");
      return;
    }

    const normalizedPhoneNumber = normalizePkPhoneNumber(phoneNumber);
    if (!normalizedPhoneNumber) {
      showModal(
        "Invalid phone number",
        "Enter a valid Pakistani mobile number like 03001234567.",
        "warning",
      );
      return;
    }

    setLoading(true);
    try {
      const ok = await signup(
        name,
        email,
        normalizedPhoneNumber,
        password,
        role,
        categories,
      );

      if (!ok) {
        throw new Error("signup failed");
      }

      showModal("Welcome aboard", "Your account is ready to go.", "success");

      setTimeout(() => {
        setModalConfig(null);
        router.replace("/(tabs)");
      }, 1600);
    } catch (err) {
      showModal(
        "Sign up failed",
        "Please review your details and try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
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
              Join Highway Help
            </Text>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}> 
              Set up your profile for roadside help or helper operations.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>Full Name</Text>
            <TextInput
              placeholder="Muhammad Ullah"
              placeholderTextColor={theme.colors.input.placeholder}
              value={name}
              onChangeText={setName}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.colors.text.primary }]}>Email</Text>
            <TextInput
              placeholder="name@example.com"
              placeholderTextColor={theme.colors.input.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.colors.text.primary }]}>Mobile Number</Text>
            <TextInput
              placeholder="03001234567"
              placeholderTextColor={theme.colors.input.placeholder}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.colors.text.primary }]}>Password</Text>
            <TextInput
              placeholder="Minimum 8 characters"
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

            <Text style={[styles.label, { color: theme.colors.text.primary }]}>I want to...</Text>
            <View style={[styles.roleContainer, { backgroundColor: theme.colors.surface }]}>
              {(["user", "helper"] as const).map((currentRole) => {
                const active = role === currentRole;
                return (
                  <TouchableOpacity
                    key={currentRole}
                    style={[
                      styles.roleTab,
                      active && {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                    onPress={() => setRole(currentRole)}
                  >
                    <Text
                      style={[
                        styles.roleTabText,
                        {
                          color: active
                            ? theme.colors.primary
                            : theme.colors.text.secondary,
                        },
                      ]}
                    >
                      {currentRole === "user" ? "Get Help" : "Be a Helper"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {role === "helper" ? (
              <View style={styles.categorySection}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  Services You Provide
                </Text>
                <View style={styles.chipContainer}>
                  {CATEGORIES.map((cat) => {
                    const isActive = categories.includes(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => toggleCategory(cat.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isActive
                              ? theme.colors.primary
                              : theme.colors.surface,
                            borderColor: isActive
                              ? theme.colors.primary
                              : theme.colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isActive
                                ? "#FFFFFF"
                                : theme.colors.text.secondary,
                            },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.signUpButton,
                { backgroundColor: theme.colors.primary },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
  screen: { flex: 1 },
  container: {
    padding: 24,
    paddingTop: 44,
    paddingBottom: 56,
  },
  panel: {
    borderWidth: 1,
    borderRadius: uiRadii.xxl,
    padding: uiSpacing.xl,
    ...uiShadows.card,
  },
  header: { marginBottom: 24 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  title: { fontSize: 30, fontWeight: "800" },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 6 },
  form: { width: "100%" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  roleContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    marginBottom: 10,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  roleTabText: { fontWeight: "700" },
  categorySection: { marginTop: 10 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: uiRadii.pill,
    borderWidth: 1,
  },
  chipText: { fontWeight: "700" },
  signUpButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    ...uiShadows.soft,
  },
  buttonText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
});
