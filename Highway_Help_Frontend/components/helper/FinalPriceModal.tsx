import React from "react";
import { View, Text, TextInput, TouchableOpacity, Modal } from "react-native";

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
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.7)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#FFF",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 30,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "900",
              color: "#111827",
              marginBottom: 5,
            }}
          >
            Final Charges
          </Text>
          <Text style={{ color: "#6B7280", marginBottom: 30 }}>
            Confirm the total amount with the user
          </Text>

          <View
            style={{
              width: "100%",
              backgroundColor: "#F9FAFB",
              borderRadius: 20,
              padding: 20,
              marginBottom: 30,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                color: "#9CA3AF",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              TOTAL AMOUNT (RS)
            </Text>
            <TextInput
              style={{
                fontSize: 42,
                fontWeight: "900",
                textAlign: "center",
                color: "#111827",
                marginTop: 10,
              }}
              placeholder="0000"
              keyboardType="numeric"
              value={finalAmount}
              onChangeText={setFinalAmount}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: "#10B981",
              width: "100%",
              height: 60,
              borderRadius: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={onConfirm}
          >
            <Text style={{ color: "#FFF", fontWeight: "900", fontSize: 18 }}>
              COLLECT & FINISH
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 20 }} onPress={onClose}>
            <Text style={{ color: "#9CA3AF", fontWeight: "600" }}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
