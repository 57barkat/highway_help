import React, { memo, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import HelperMapSection from "../../components/helper/HelperMapSection";

interface Props {
  bottomSheetRef: any;
  selectedRequest: any;
  helperLocation: any;
  sendOffer: (reqId: number, price: number) => void;
}

export function HelperBottomSheetSection({
  bottomSheetRef,
  selectedRequest,
  helperLocation,
  sendOffer,
}: Props) {
  const [price, setPrice] = useState("");
  const snapPoints = useMemo(() => ["90%"], []);

  const quickBidOptions = useMemo(() => {
    if (!selectedRequest?.suggestedPrice) return [];
    const base = selectedRequest.suggestedPrice;
    return [base, Math.round(base * 1.1), Math.round(base * 1.2)];
  }, [selectedRequest?.suggestedPrice]);

  useEffect(() => {
    if (selectedRequest) {
      setPrice(selectedRequest.suggestedPrice?.toString() || "");
    }
  }, [selectedRequest?.requestId]);

  const travelInfo = useMemo(() => {
    if (!selectedRequest || !helperLocation) return { km: null, mins: null };
    const lat1 = helperLocation.latitude || helperLocation.lat;
    const lon1 = helperLocation.longitude || helperLocation.lng;
    const lat2 = selectedRequest.lat;
    const lon2 = selectedRequest.lng;
    if (!lat1 || !lon1 || !lat2 || !lon2) return { km: null, mins: null };
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
    if (!numericPrice || numericPrice <= 0) return;
    if (numericPrice < basePrice) {
      Alert.alert(
        "Invalid Price",
        `Price cannot be less than the base price (Rs ${basePrice})`,
      );
      return;
    }
    if (numericPrice > maxPrice) {
      Alert.alert(
        "Price Too High",
        `For quality service, your bid cannot exceed Rs ${Math.round(maxPrice)}`,
      );
      return;
    }
    sendOffer(selectedRequest.requestId, numericPrice);
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      keyboardBehavior="fillParent"
      keyboardBlurBehavior="restore"
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        {selectedRequest ? (
          <View style={{ flex: 1 }}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Review & Bid</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#F43F5E" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {selectedRequest.areaName || "Rawalpindi / Islamabad"}
                  </Text>
                </View>
              </View>
              <View style={styles.badgeColumn}>
                <View style={styles.etaBadge}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={12}
                    color="#059669"
                  />
                  <Text style={styles.etaText}>{travelInfo.mins || "--"}</Text>
                </View>
                <View style={styles.distBadge}>
                  <Text style={styles.distText}>
                    {travelInfo.km || "0.0"} km
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.mapContainer}>
              <HelperMapSection
                helperLocation={helperLocation}
                userLocation={{
                  lat: selectedRequest.lat,
                  lng: selectedRequest.lng,
                }}
                jobStage="arriving"
                online={true}
              />
              <View style={styles.floatingPill}>
                <Text style={styles.pillText}>
                  {travelInfo.km
                    ? `${travelInfo.km} km away`
                    : "Calculating..."}
                </Text>
              </View>
            </View>
            <View style={styles.actionArea}>
              <View style={styles.userSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {selectedRequest.userName[0]}
                  </Text>
                </View>
                <Text style={styles.userName}>
                  {selectedRequest.userName}'s Request
                </Text>
              </View>
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>Set Your Best Price (PKR)</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.currencySymbol}>Rs</Text>
                  <BottomSheetTextInput
                    style={styles.textInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                  <View style={styles.suggestedTag}>
                    <Text style={styles.tagText}>
                      BASE: {selectedRequest.suggestedPrice}
                    </Text>
                  </View>
                </View>
                <View style={styles.quickBidRow}>
                  {quickBidOptions.map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.bidChip,
                        price === val.toString() && styles.activeBidChip,
                      ]}
                      onPress={() => setPrice(val.toString())}
                    >
                      <Text
                        style={[
                          styles.bidChipText,
                          price === val.toString() && styles.activeBidChipText,
                        ]}
                      >
                        Rs {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={styles.sendButton} onPress={onSendOffer}>
                <Text style={styles.sendButtonText}>Send Fast Offer</Text>
                <Ionicons name="paper-plane" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color="#6366F1" />
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  handleIndicator: { backgroundColor: "#E2E8F0", width: 50, height: 4 },
  contentContainer: { flex: 1, padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "900", color: "#0F172A" },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationText: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 4,
    fontWeight: "600",
  },
  badgeColumn: { alignItems: "flex-end" },
  etaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  etaText: { fontSize: 11, fontWeight: "800", color: "#059669", marginLeft: 4 },
  distBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distText: { fontSize: 10, fontWeight: "700", color: "#64748B" },
  mapContainer: {
    height: 180,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  floatingPill: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  actionArea: { marginTop: 24 },
  userSection: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontWeight: "bold" },
  userName: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },
  inputCard: {
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  inputRow: { flexDirection: "row", alignItems: "center" },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginRight: 10,
  },
  textInput: { flex: 1, fontSize: 32, fontWeight: "900", color: "#0F172A" },
  suggestedTag: {
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tagText: { fontSize: 10, fontWeight: "700", color: "#64748B" },
  quickBidRow: { flexDirection: "row", marginTop: 15, gap: 8 },
  bidChip: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeBidChip: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  bidChipText: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  activeBidChipText: { color: "#FFF" },
  sendButton: {
    backgroundColor: "#0F172A",
    height: 65,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  sendButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 10,
  },
  loading: { flex: 1, justifyContent: "center" },
});

export default memo(HelperBottomSheetSection);
