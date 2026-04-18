import React, { memo, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import HelperMapSection from "../../components/helper/HelperMapSection";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/theme";
import { uiRadii, uiSpacing } from "@/lib/ui/system";
import { StatusModal } from "@/models/StatusModal";

interface Props {
  bottomSheetRef: any;
  selectedRequest: any;
  helperLocation: any;
  sendOffer: (reqId: number, price: number) => void;
  cooldownRemaining?: number;
}

export function HelperBottomSheetSection({
  bottomSheetRef,
  selectedRequest,
  helperLocation,
  sendOffer,
  cooldownRemaining = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [price, setPrice] = useState("");
  const [isPriceModalVisible, setPriceModalVisible] = useState(false);
  const [validationModal, setValidationModal] = useState<{
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  const snapPoints = useMemo(() => ["92%"], []);

  const quickBidOptions = useMemo(() => {
    if (!selectedRequest?.suggestedPrice) return [];
    const base = selectedRequest.suggestedPrice;
    return [base, Math.round(base * 1.1), Math.round(base * 1.2)];
  }, [selectedRequest?.suggestedPrice]);

  useEffect(() => {
    if (selectedRequest) {
      setPrice(selectedRequest.suggestedPrice?.toString() || "");
    }
  }, [selectedRequest?.requestId, selectedRequest?.suggestedPrice]);

  const travelInfo = useMemo(() => {
    if (!selectedRequest || !helperLocation) return { km: null, mins: null };

    const lat1 = helperLocation.latitude ?? helperLocation.lat;
    const lon1 = helperLocation.longitude ?? helperLocation.lng;
    const lat2 = selectedRequest.lat;
    const lon2 = selectedRequest.lng;

    if (
      lat1 === undefined ||
      lon1 === undefined ||
      lat2 === undefined ||
      lon2 === undefined ||
      lat1 === null ||
      lon1 === null ||
      lat2 === null ||
      lon2 === null
    ) {
      return { km: null, mins: null };
    }

    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = R * c;
    const mins = Math.round((km / 30) * 60 + 2);

    return {
      km: km.toFixed(1),
      mins: mins > 60 ? "1h+" : `${mins} mins`,
    };
  }, [selectedRequest, helperLocation]);

  const onSendOffer = () => {
    const numericPrice = parseFloat(price);
    const basePrice = selectedRequest?.suggestedPrice || 0;
    const maxPrice = basePrice * 1.2;

    if (!numericPrice || numericPrice <= 0) {
      setValidationModal({
        title: "Invalid price",
        message: "Please enter a valid price before sending the offer.",
        type: "warning",
      });
      return;
    }

    if (numericPrice < basePrice) {
      setValidationModal({
        title: "Invalid price",
        message: `Price cannot be less than the base price (Rs ${basePrice}).`,
        type: "warning",
      });
      return;
    }

    if (numericPrice > maxPrice) {
      setValidationModal({
        title: "Price too high",
        message: `For quality service, your bid cannot exceed Rs ${Math.round(
          maxPrice,
        )}.`,
        type: "warning",
      });
      return;
    }

    if (cooldownRemaining > 0) return;

    sendOffer(selectedRequest.requestId, numericPrice);
  };

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{
          backgroundColor: theme.colors.card,
          borderRadius: 40,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.border,
          width: 50,
        }}
      >
        {selectedRequest ? (
          <View style={styles.sheetRoot}>
            <BottomSheetScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingBottom: Math.max(insets.bottom, 16) + 120,
                },
              ]}
            >
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Text
                    style={[styles.title, { color: theme.colors.text.primary }]}
                  >
                    Review & Bid
                  </Text>

                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location"
                      size={14}
                      color={theme.colors.error || "#F43F5E"}
                    />
                    <Text
                      style={[
                        styles.locationText,
                        { color: theme.colors.text.secondary },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedRequest.areaName || "Rawalpindi / Islamabad"}
                    </Text>
                  </View>
                </View>

                <View style={styles.badgeColumn}>
                  <View
                    style={[
                      styles.etaBadge,
                      {
                        backgroundColor: theme.isDark ? "#064E3B" : "#DCFCE7",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={12}
                      color={theme.colors.success || "#059669"}
                    />
                    <Text
                      style={[
                        styles.etaText,
                        { color: theme.colors.success || "#059669" },
                      ]}
                    >
                      {travelInfo.mins || "--"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.distBadge,
                      { backgroundColor: theme.colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.distText,
                        { color: theme.colors.text.secondary },
                      ]}
                    >
                      {travelInfo.km || "0.0"} km
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.mapContainer,
                  { borderColor: theme.colors.border },
                ]}
              >
                <HelperMapSection
                  helperLocation={helperLocation}
                  userLocation={{
                    lat: selectedRequest.lat,
                    lng: selectedRequest.lng,
                  }}
                  jobStage="arriving"
                  online={true}
                />

                <View
                  style={[
                    styles.floatingPill,
                    { backgroundColor: theme.colors.text.primary },
                  ]}
                >
                  <Text style={[styles.pillText, { color: theme.colors.card }]}>
                    {travelInfo.km
                      ? `${travelInfo.km} km away`
                      : "Calculating..."}
                  </Text>
                </View>
              </View>

              <View style={styles.actionArea}>
                <View style={styles.userSection}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {selectedRequest.userName?.[0] || "U"}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.userName,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    {selectedRequest.userName || "User"}&apos;s Request
                  </Text>
                </View>

                {cooldownRemaining > 0 && (
                  <View
                    style={[
                      styles.cooldownBanner,
                      {
                        backgroundColor: theme.isDark ? "#2D1B00" : "#FFF7ED",
                        borderColor: theme.colors.warning,
                      },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={theme.colors.warning}
                    />
                    <Text
                      style={[
                        styles.cooldownText,
                        { color: theme.isDark ? "#FFB84D" : "#9A3412" },
                      ]}
                    >
                      Update available in {cooldownRemaining}s
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.inputCard,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Set Your Best Price (PKR)
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setPriceModalVisible(true)}
                    style={[
                      styles.inputTrigger,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <View style={styles.inputTriggerLeft}>
                      <Text
                        style={[
                          styles.inputTriggerCurrency,
                          { color: theme.colors.text.primary },
                        ]}
                      >
                        Rs
                      </Text>
                      <Text
                        style={[
                          styles.inputTriggerValue,
                          {
                            color: price
                              ? theme.colors.text.primary
                              : theme.colors.text.secondary,
                          },
                        ]}
                      >
                        {price || "Enter your offer"}
                      </Text>
                    </View>

                    <Feather
                      name="edit-3"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.suggestedTag,
                      {
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: theme.colors.text.secondary },
                      ]}
                    >
                      BASE: {selectedRequest.suggestedPrice}
                    </Text>
                  </View>

                  <View style={styles.quickBidRow}>
                    {quickBidOptions.map((val) => (
                      <TouchableOpacity
                        key={val}
                        activeOpacity={0.85}
                        style={[
                          styles.bidChip,
                          {
                            backgroundColor: theme.colors.card,
                            borderColor: theme.colors.border,
                          },
                          price === val.toString() && {
                            backgroundColor: theme.colors.text.primary,
                            borderColor: theme.colors.text.primary,
                          },
                        ]}
                        onPress={() => setPrice(val.toString())}
                      >
                        <Text
                          style={[
                            styles.bidChipText,
                            { color: theme.colors.text.secondary },
                            price === val.toString() && {
                              color: theme.colors.card,
                            },
                          ]}
                        >
                          Rs {val}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </BottomSheetScrollView>

            <View
              style={[
                styles.bottomBar,
                {
                  paddingBottom: Math.max(insets.bottom, 12),
                  backgroundColor: theme.colors.card,
                  borderTopColor: theme.colors.border,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.sendButton,
                  { backgroundColor: theme.colors.primary },
                  cooldownRemaining > 0 && {
                    backgroundColor: theme.colors.border,
                  },
                ]}
                onPress={onSendOffer}
                disabled={cooldownRemaining > 0}
              >
                <Text
                  style={[
                    styles.sendButtonText,
                    {
                      color:
                        theme.isDark && cooldownRemaining > 0
                          ? theme.colors.text.primary
                          : "#FFF",
                    },
                  ]}
                >
                  {cooldownRemaining > 0
                    ? `Offer sent • ${cooldownRemaining}s`
                    : "Send Fast Offer"}
                </Text>

                <Ionicons
                  name={
                    cooldownRemaining > 0 ? "checkmark-circle" : "paper-plane"
                  }
                  size={18}
                  color={
                    theme.isDark && cooldownRemaining > 0
                      ? theme.colors.text.primary
                      : "#FFF"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}
      </BottomSheet>

      <Modal
        visible={isPriceModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setPriceModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPriceModalVisible(false)}
        >
          <Pressable>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
              style={styles.keyboardAvoiding}
            >
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: theme.colors.card,
                    paddingBottom: Math.max(insets.bottom, 20),
                  },
                ]}
              >
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    Enter Your Offer
                  </Text>

                  <TouchableOpacity
                    onPress={() => setPriceModalVisible(false)}
                    style={styles.doneBtn}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.doneBtnText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Set a professional bid for this request
                </Text>

                <View
                  style={[
                    styles.modalInputWrap,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalCurrency,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    Rs
                  </Text>

                  <TextInput
                    style={[
                      styles.modalInput,
                      { color: theme.colors.text.primary },
                    ]}
                    placeholder="0"
                    placeholderTextColor={theme.isDark ? "#475569" : "#94A3B8"}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                    autoFocus
                    selectionColor={theme.colors.primary}
                    returnKeyType="done"
                  />
                </View>

                <View style={styles.modalBaseRow}>
                  <Text
                    style={[
                      styles.modalBaseText,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    Base price: Rs {selectedRequest?.suggestedPrice || 0}
                  </Text>
                </View>

                <View style={styles.modalQuickBidRow}>
                  {quickBidOptions.map((val) => (
                    <TouchableOpacity
                      key={val}
                      activeOpacity={0.85}
                      style={[
                        styles.modalBidChip,
                        {
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                        },
                        price === val.toString() && {
                          backgroundColor: theme.colors.text.primary,
                          borderColor: theme.colors.text.primary,
                        },
                      ]}
                      onPress={() => setPrice(val.toString())}
                    >
                      <Text
                        style={[
                          styles.modalBidChipText,
                          { color: theme.colors.text.secondary },
                          price === val.toString() && {
                            color: theme.colors.card,
                          },
                        ]}
                      >
                        Rs {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>

      {validationModal && (
        <StatusModal
          visible={true}
          title={validationModal.title}
          message={validationModal.message}
          type={validationModal.type}
          onClose={() => setValidationModal(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sheetRoot: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: uiSpacing.xl,
    paddingTop: uiSpacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingRight: 8,
  },
  locationText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: "600",
    flex: 1,
  },
  badgeColumn: {
    alignItems: "flex-end",
  },
  etaBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  etaText: {
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 4,
  },
  distBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distText: {
    fontSize: 10,
    fontWeight: "700",
  },
  mapContainer: {
    height: 180,
    borderRadius: uiRadii.xl,
    overflow: "hidden",
    borderWidth: 1,
  },
  floatingPill: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  actionArea: {
    marginTop: 24,
  },
  cooldownBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: uiRadii.lg,
    paddingHorizontal: uiSpacing.md,
    paddingVertical: uiSpacing.sm,
    marginBottom: uiSpacing.md,
  },
  cooldownText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "700",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  userName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  inputCard: {
    padding: 20,
    borderRadius: uiRadii.xl,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputTrigger: {
    minHeight: 72,
    borderRadius: uiRadii.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputTriggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  inputTriggerCurrency: {
    fontSize: 22,
    fontWeight: "900",
    marginRight: 10,
  },
  inputTriggerValue: {
    fontSize: 22,
    fontWeight: "800",
    flex: 1,
  },
  suggestedTag: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  quickBidRow: {
    flexDirection: "row",
    // marginTop: 15,
    gap: 8,
  },
  bidChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  bidChipText: {
    fontSize: 14,
    fontWeight: "700",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 80,
    paddingHorizontal: uiSpacing.xl,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  sendButton: {
    height: 60,
    borderRadius: uiRadii.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: "800",
    marginRight: 10,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardAvoiding: {
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 14,
    minHeight: "48%",
    maxHeight: "82%",
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#94A3B8",
    opacity: 0.45,
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  doneBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  doneBtnText: {
    fontWeight: "800",
    fontSize: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 6,
    marginBottom: 18,
  },
  modalInputWrap: {
    minHeight: 84,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  modalCurrency: {
    fontSize: 28,
    fontWeight: "900",
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "900",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  modalBaseRow: {
    marginTop: 14,
    marginBottom: 18,
  },
  modalBaseText: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalQuickBidRow: {
    flexDirection: "row",
    gap: 8,
  },
  modalBidChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  modalBidChipText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

export default memo(HelperBottomSheetSection);
