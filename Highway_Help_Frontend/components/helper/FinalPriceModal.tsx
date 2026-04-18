import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "@/context/theme";
import { uiRadii, uiSpacing } from "@/lib/ui/system";

interface Props {
  visible: boolean;
  finalAmount: string;
  setFinalAmount: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function FinalPriceModal({
  visible,
  finalAmount,
  setFinalAmount,
  onConfirm,
  onClose,
}: Props) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.card },
          ]}
        >
          <View
            style={[styles.handle, { backgroundColor: theme.colors.border }]}
          />

          <Text style={[styles.title, { color: theme.colors.text.primary }]}>
            Final Charges
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.text.secondary }]}
          >
            Confirm the total amount with the user
          </Text>

          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Text style={styles.inputLabel}>TOTAL AMOUNT (RS)</Text>
            <TextInput
              style={[styles.textInput, { color: theme.colors.text.primary }]}
              placeholder="0000"
              placeholderTextColor={theme.isDark ? "#475569" : "#9CA3AF"}
              keyboardType="numeric"
              value={finalAmount}
              onChangeText={setFinalAmount}
              autoFocus
              selectionColor={theme.colors.primary}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              { backgroundColor: theme.colors.success || "#10B981" },
            ]}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>COLLECT & FINISH</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text
              style={[
                styles.cancelText,
                { color: theme.colors.text.secondary },
              ]}
            >
              Dismiss
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  modalContainer: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: uiSpacing.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : 30,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 25,
    textAlign: "center",
  },
  inputWrapper: {
    width: "100%",
    borderRadius: uiRadii.xl,
    padding: 20,
    marginBottom: 25,
    alignItems: "center",
  },
  inputLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  textInput: {
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center",
    width: "100%",
    marginTop: 5,
  },
  confirmBtn: {
    width: "100%",
    height: 65,
    borderRadius: uiRadii.lg,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmBtnText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    marginTop: 20,
    padding: 10,
  },
  cancelText: {
    fontWeight: "700",
    fontSize: 14,
  },
});
