import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/theme";
import { darkUiColors, lightUiColors, uiRadii, uiShadows, uiSpacing } from "@/lib/ui/system";

interface StatusModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  buttonText?: string;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
}

const { width } = Dimensions.get("window");

export const StatusModal = ({
  visible,
  onClose,
  title,
  message,
  type,
  buttonText = "Got it",
  secondaryButtonText,
  onSecondaryPress,
}: StatusModalProps) => {
  const { theme } = useTheme();
  const palette = theme.isDark ? darkUiColors : lightUiColors;

  const getIcon = () => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle", color: palette.success };
      case "error":
        return { name: "close-circle", color: palette.danger };
      case "warning":
        return { name: "warning", color: palette.warning };
      default:
        return { name: "information-circle", color: palette.info };
    }
  };

  const icon = getIcon();

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable
        style={[styles.overlay, { backgroundColor: palette.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <Ionicons
            name={icon.name as any}
            size={60}
            color={icon.color}
            style={styles.icon}
          />
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
            {message}
          </Text>
          <View style={styles.footer}>
            {secondaryButtonText ? (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
                onPress={onSecondaryPress ?? onClose}
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  {secondaryButtonText}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: icon.color }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: uiSpacing.lg,
  },
  modalContainer: {
    width: Math.min(width * 0.88, 420),
    borderRadius: uiRadii.xl,
    padding: uiSpacing.xl,
    alignItems: "center",
    borderWidth: 1,
    ...uiShadows.card,
  },
  icon: { marginBottom: 15 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: uiSpacing.lg,
    lineHeight: 23,
  },
  footer: {
    width: "100%",
    flexDirection: "row",
    gap: uiSpacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: uiRadii.md,
    alignItems: "center",
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: uiRadii.md,
    borderWidth: 1,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
  secondaryButtonText: { fontWeight: "700", fontSize: 16 },
});
