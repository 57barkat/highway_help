import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Users, Heart } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "@/context/theme";
import AppButton from "@/components/app-button";

type UserRole = "user" | "helper";

export default function RoleSelectionScreen() {
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const { theme } = useTheme();

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    await AsyncStorage.setItem("user_role", role);
    router.push({
      pathname: "/auth/phone",
      params: { role },
    });
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
            {
              paddingTop: insets.top + 40,
              paddingBottom: insets.bottom + 32,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  fontFamily: "Montserrat-Bold",
                  color: theme.colors.text.primary,
                },
              ]}
            >
              Choose Your Role
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
              Select how you'd like to use the app
            </Text>
          </View>

          {/* Role Selection Cards */}
          <View style={styles.rolesContainer}>
            {/* User Role Card */}
            <View
              style={[
                styles.roleCard,
                {
                  backgroundColor: theme.colors.input.background,
                  borderWidth: selectedRole === "user" ? 2 : 1,
                  borderColor:
                    selectedRole === "user"
                      ? theme.colors.primary
                      : theme.colors.input.border,
                },
              ]}
            >
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
                <Users size={32} color={theme.colors.primary} />
              </View>

              <Text
                style={[
                  styles.roleTitle,
                  {
                    fontFamily: "Montserrat-Bold",
                    color: theme.colors.text.primary,
                  },
                ]}
              >
                I'm a User
              </Text>

              <Text
                style={[
                  styles.roleDescription,
                  {
                    fontFamily: "Montserrat-Regular",
                    color: theme.colors.text.secondary,
                  },
                ]}
              >
                I need help with daily tasks and activities
              </Text>

              <AppButton
                title="Continue as User"
                onPress={() => handleRoleSelect("user")}
                variant={selectedRole === "user" ? "primary" : "secondary"}
                size="medium"
                style={styles.roleButton}
              />
            </View>

            {/* Helper Role Card */}
            <View
              style={[
                styles.roleCard,
                {
                  backgroundColor: theme.colors.input.background,
                  borderWidth: selectedRole === "helper" ? 2 : 1,
                  borderColor:
                    selectedRole === "helper"
                      ? theme.colors.primary
                      : theme.colors.input.border,
                },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(34, 197, 94, 0.15)"
                      : "rgba(34, 197, 94, 0.1)",
                  },
                ]}
              >
                <Heart size={32} color="#22c55e" />
              </View>

              <Text
                style={[
                  styles.roleTitle,
                  {
                    fontFamily: "Montserrat-Bold",
                    color: theme.colors.text.primary,
                  },
                ]}
              >
                I'm a Helper
              </Text>

              <Text
                style={[
                  styles.roleDescription,
                  {
                    fontFamily: "Montserrat-Regular",
                    color: theme.colors.text.secondary,
                  },
                ]}
              >
                I want to help others with their daily tasks
              </Text>

              <AppButton
                title="Continue as Helper"
                onPress={() => handleRoleSelect("helper")}
                variant={selectedRole === "helper" ? "primary" : "secondary"}
                size="medium"
                style={styles.roleButton}
              />
            </View>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 48,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  rolesContainer: {
    gap: 24,
  },
  roleCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  roleDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  roleButton: {
    width: "100%",
  },
  spacer: {
    flex: 1,
  },
});
