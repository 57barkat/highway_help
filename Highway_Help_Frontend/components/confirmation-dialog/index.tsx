import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  AccessibilityInfo,
} from "react-native";
import { RoadsideService } from "@/lib/services/roadside-api";
import { SERVICE_TYPES } from "@/lib/types";
import { IconSymbol } from "@/components/icon-symbol";
import { useTheme } from "@/context/theme";
import { BlurView } from "expo-blur";

interface ConfirmationDialogProps {
  visible: boolean;
  service: RoadsideService | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  service,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const { theme } = useTheme();

  if (!service) return null;

  const serviceInfo = SERVICE_TYPES[service.type];

  const handleConfirm = () => {
    AccessibilityInfo.announceForAccessibility(
      `Requesting ${service.title} service`
    );
    onConfirm();
  };

  const handleCancel = () => {
    AccessibilityInfo.announceForAccessibility("Service request cancelled");
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal={true}
      accessible={true}
      accessibilityLabel="Service confirmation dialog"
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <BlurView
          intensity={20}
          style={StyleSheet.absoluteFill}
          tint={theme.isDark ? "dark" : "light"}
        />
        <Pressable
          style={[
            styles.dialogContainer,
            { backgroundColor: theme.colors.card },
          ]}
          onPress={(e) => e.stopPropagation()}
          accessible={true}
          accessibilityLabel={`Confirm ${service.title} request`}
        >
          {/* Header with Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: theme.colors.primary + "15" },
            ]}
          >
            <IconSymbol
              name={serviceInfo.icon as any}
              size={48}
              color={theme.colors.primary}
              library={serviceInfo.library}
            />
          </View>

          {/* Title */}
          <Text
            style={[styles.title, { color: theme.colors.text.primary }]}
            accessible={true}
            accessibilityRole="header"
          >
            Request {service.title}?
          </Text>

          {/* Description */}
          <Text
            style={[styles.description, { color: theme.colors.text.secondary }]}
            accessible={true}
          >
            {service.description}
          </Text>

          {/* Service Details */}
          <View
            style={[
              styles.detailsContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Estimated Time:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: theme.colors.text.primary },
                ]}
              >
                {service.estimatedTime}
              </Text>
            </View>
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: theme.colors.text.secondary },
                ]}
              >
                Estimated Price:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  styles.priceValue,
                  { color: theme.colors.primary },
                ]}
              >
                {service.price}
              </Text>
            </View>
          </View>

          {/* Info Message */}
          <View
            style={[
              styles.infoBox,
              { backgroundColor: theme.colors.info + "15" },
            ]}
          >
            <Text style={[styles.infoText, { color: theme.colors.info }]}>
              A helper will be dispatched to your location once you confirm.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={handleCancel}
              disabled={loading}
              accessible={true}
              accessibilityLabel="Cancel service request"
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.colors.text.primary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleConfirm}
              disabled={loading}
              accessible={true}
              accessibilityLabel="Confirm service request"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
            >
              <Text style={[styles.buttonText, styles.confirmButtonText]}>
                {loading ? "Requesting..." : "Confirm Request"}
              </Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dialogContainer: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  detailsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  priceValue: {
    fontWeight: "700",
  },
  infoBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  confirmButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#FFFFFF",
  },
});

export default ConfirmationDialog;
