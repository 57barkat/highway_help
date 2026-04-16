import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X } from "lucide-react-native";

interface TopUpModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  initialAmount?: string;
}

export const TopUpModal = ({
  visible,
  onClose,
  onConfirm,
  initialAmount = "500",
}: TopUpModalProps) => {
  const [amount, setAmount] = useState(initialAmount);
  const quickAmounts = ["200", "500", "1000", "2000"];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Top Up Wallet</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Enter Amount (Rs.)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="Min Rs. 100"
          />

          <View style={styles.quickSelectContainer}>
            {quickAmounts.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.quickBtn}
                onPress={() => setAmount(item)}
              >
                <Text style={styles.quickBtnText}>+{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => onConfirm(parseInt(amount || "0"))}
          >
            <Text style={styles.confirmBtnText}>Proceed to Payment</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  label: { fontSize: 14, color: "#94A3B8", marginBottom: 8, fontWeight: "600" },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    fontWeight: "700",
    color: "#00A99D",
    marginBottom: 20,
  },
  quickSelectContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  quickBtn: {
    backgroundColor: "#00A99D10",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#00A99D",
  },
  quickBtnText: { color: "#00A99D", fontWeight: "700", fontSize: 12 },
  confirmBtn: {
    backgroundColor: "#00A99D",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnText: { color: "white", fontWeight: "800", fontSize: 16 },
});
