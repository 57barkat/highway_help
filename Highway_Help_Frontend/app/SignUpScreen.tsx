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
import api from "../api/api";
import { router } from "expo-router";
import { StatusModal } from "@/models/StatusModal";

const CATEGORIES = [
  { id: "flat_tire", label: "Flat Tire" },
  { id: "fuel", label: "Fuel Delivery" },
  { id: "battery", label: "Battery Jump" },
  { id: "tow", label: "Towing" },
];

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
    if (!name || !email || !password) {
      showModal("Missing Info", "Please fill out all fields.", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload: any = { name, email, password, role };
      if (role === "helper") payload.categories = categories;

      await api.post("/auth/register", payload);

      // Success Modal
      showModal("Welcome!", "Account created successfully.", "success");

      // Navigate after a short delay so they can see the success state
      setTimeout(() => {
        setModalConfig(null);
        router.replace("/SignIn");
      }, 2000);
    } catch (err) {
      showModal("Error", "Sign up failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#FFF" }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our community today</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            placeholder="Muhammad Ullah"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <Text style={styles.label}>I want to...</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleTab, role === "user" && styles.activeTab]}
              onPress={() => setRole("user")}
            >
              <Text
                style={[
                  styles.roleTabText,
                  role === "user" && styles.activeTabText,
                ]}
              >
                Get Help
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleTab, role === "helper" && styles.activeTab]}
              onPress={() => setRole("helper")}
            >
              <Text
                style={[
                  styles.roleTabText,
                  role === "helper" && styles.activeTabText,
                ]}
              >
                Be a Helper
              </Text>
            </TouchableOpacity>
          </View>

          {role === "helper" && (
            <View style={styles.categorySection}>
              <Text style={styles.label}>Services You Provide</Text>
              <View style={styles.chipContainer}>
                {CATEGORIES.map((cat) => {
                  const isActive = categories.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => toggleCategory(cat.id)}
                      style={[styles.chip, isActive && styles.activeChip]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isActive && styles.activeChipText,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.signUpButton, loading && { opacity: 0.7 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {modalConfig && (
        <StatusModal
          visible={modalConfig.visible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={() => setModalConfig(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 32 },
  title: { fontSize: 30, fontWeight: "800", color: "#1A1A1A" },
  subtitle: { fontSize: 16, color: "#666", marginTop: 4 },
  form: { width: "100%" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F5F7FA",
    height: 54,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E1E8ED",
  },
  roleContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F7FA",
    padding: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleTabText: { fontWeight: "600", color: "#666" },
  activeTabText: { color: "#4F46E5" },
  categorySection: { marginTop: 10 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E8ED",
    backgroundColor: "#FFF",
  },
  activeChip: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  chipText: { color: "#666", fontWeight: "500" },
  activeChipText: { color: "#FFF" },
  signUpButton: {
    backgroundColor: "#1A1A1A",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  buttonText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
});
