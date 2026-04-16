import React, { useRef, useState, Suspense, lazy, useEffect } from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import BottomSheet from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useHelper } from "@/context/HelperContext";
import { StatusModal } from "@/models/StatusModal";

const HelperHeaderSection = lazy(
  () => import("../../components/helper/HelperHeaderSection"),
);
const HelperWorkflowSection = lazy(
  () => import("../../components/helper/HelperWorkflowSection"),
);
const FinalPriceModal = lazy(
  () => import("../../components/helper/FinalPriceModal"),
);
import HelperBottomSheetSection from "../../components/helper/HelperBottomSheetSection";

const { width } = Dimensions.get("window");

export default function HelperScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  const [cooldowns, setCooldowns] = useState<Record<number, number>>({});

  const {
    online,
    incomingRequests,
    jobStage,
    toggleOnline,
    sendOffer,
    helperLocation,
    userLocation,
    markArrived,
    startWork,
    cancelRide,
    agreedPrice,
    completeWork,
    modalConfig,
    setModalConfig,
  } = useHelper();

  useEffect(() => {
    if (
      jobStage !== "idle" &&
      helperLocation &&
      userLocation &&
      mapRef.current
    ) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: helperLocation.lat, longitude: helperLocation.lng },
          { latitude: userLocation.lat, longitude: userLocation.lng },
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
          animated: true,
        },
      );
    }
  }, [jobStage, helperLocation, userLocation]);

  const handleOpenRequest = (item: any) => {
    setSelectedRequest(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => bottomSheetRef.current?.snapToIndex(0), 100);
  };

  const handleCompletePress = async () => {
    const price = parseFloat(finalAmount);
    if (isNaN(price) || price < agreedPrice) {
      // Replaced standard alert with showModal logic
      setModalConfig({
        visible: true,
        title: "Invalid Price",
        message: `Price cannot be less than Rs ${agreedPrice}`,
        type: "warning",
      });
      return;
    }
    await completeWork(price, agreedPrice);
    setShowPriceModal(false);
    setFinalAmount("");
  };

  const getProblemIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "flat_tire":
        return "tire";
      case "engine issue":
        return "engine-outline";
      case "general help":
        return "hand-heart-outline";
      default:
        return "hammer-wrench";
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    console.log("Rendering request item:", item);
    const isLocked = (cooldowns[item.requestId] || 0) > 0;
    const displayAddress =
      item.areaName ?? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`;

    return (
      <View style={styles.premiumCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={getProblemIcon(item.problemType)}
              size={28}
              color="#6366F1"
            />
          </View>

          <View style={styles.problemContainer}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.typeTag,
                  item.problemType === "flat_tire" && styles.urgentTag,
                ]}
              >
                <Text
                  style={[
                    styles.typeTagText,
                    item.problemType === "flat_tire" && styles.urgentText,
                  ]}
                >
                  {item.status?.toUpperCase() || "NEW"}
                </Text>
              </View>
              <Text style={styles.distanceText}>• Nearby</Text>
            </View>

            <Text style={styles.problemTitle} numberOfLines={1}>
              {item.problemType.replace("_", " ")}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={12} color="#94A3B8" />
              <Text style={styles.locationText} numberOfLines={1}>
                {displayAddress}
              </Text>
            </View>

            {/* MOVED DESCRIPTION HERE FOR BETTER VISIBILITY */}
            {item.description && (
              <Text style={styles.descriptionText} numberOfLines={1}>
                "{item.description}"
              </Text>
            )}
          </View>

          <View style={styles.priceTag}>
            <Text style={styles.currency}>PKR</Text>
            <Text style={styles.amount}>{Math.floor(item.suggestedPrice)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <View style={styles.clientRow}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarLetter}>{item.userName.charAt(0)}</Text>
            </View>
            <Text style={styles.clientName}>{item.userName}</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, isLocked && styles.disabledButton]}
            onPress={() => handleOpenRequest(item)}
            disabled={isLocked}
          >
            <Text style={styles.actionButtonText}>
              {isLocked
                ? `Locked ${cooldowns[item.requestId]}s`
                : "View Details"}
            </Text>
            {!isLocked && (
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <Suspense
          fallback={
            <ActivityIndicator
              size="large"
              color="#6366F1"
              style={{ marginTop: 50 }}
            />
          }
        >
          {jobStage === "idle" ? (
            <>
              <HelperHeaderSection
                online={online}
                toggleOnline={toggleOnline}
              />
              <FlatList
                data={incomingRequests}
                keyExtractor={(item) => item.requestId.toString()}
                contentContainerStyle={styles.listContainer}
                renderItem={renderRequestItem}
                ListEmptyComponent={
                  <View style={styles.emptyStateContainer}>
                    <MaterialCommunityIcons
                      name="radar"
                      size={60}
                      color="#6366F1"
                    />
                    <Text style={styles.emptyTitle}>Scanning Area...</Text>
                  </View>
                }
              />
            </>
          ) : (
            <View style={styles.fullMapContainer}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: helperLocation?.lat || 33.6844,
                  longitude: helperLocation?.lng || 73.0479,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                {helperLocation && (
                  <Marker
                    coordinate={{
                      latitude: helperLocation.lat,
                      longitude: helperLocation.lng,
                    }}
                    title="You"
                  >
                    <View style={styles.markerCircle}>
                      <Ionicons name="construct" size={18} color="white" />
                    </View>
                  </Marker>
                )}
                {userLocation && (
                  <Marker
                    coordinate={{
                      latitude: userLocation.lat,
                      longitude: userLocation.lng,
                    }}
                    title="User"
                  >
                    <View
                      style={[
                        styles.markerCircle,
                        { backgroundColor: "#F43F5E" },
                      ]}
                    >
                      <Ionicons name="person" size={18} color="white" />
                    </View>
                  </Marker>
                )}
              </MapView>
              <View style={styles.workflowOverlay}>
                <HelperWorkflowSection
                  jobStage={jobStage}
                  markArrived={markArrived}
                  startWork={startWork}
                  setShowPriceModal={setShowPriceModal}
                  cancelRide={cancelRide}
                />
              </View>
            </View>
          )}

          <FinalPriceModal
            visible={showPriceModal}
            finalAmount={finalAmount}
            setFinalAmount={setFinalAmount}
            onConfirm={handleCompletePress}
            onClose={() => setShowPriceModal(false)}
          />

          <HelperBottomSheetSection
            bottomSheetRef={bottomSheetRef}
            selectedRequest={selectedRequest}
            helperLocation={helperLocation}
            sendOffer={async (reqId, price) => {
              if (await sendOffer(reqId, price)) {
                setCooldowns((prev) => ({ ...prev, [reqId]: 60 }));
                bottomSheetRef.current?.close();
              }
            }}
          />

          {modalConfig && (
            <StatusModal
              visible={modalConfig.visible}
              title={modalConfig.title}
              message={modalConfig.message}
              type={modalConfig.type}
              onClose={() => setModalConfig(null)}
            />
          )}
        </Suspense>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  listContainer: { padding: 16 },
  fullMapContainer: { flex: 1 },
  workflowOverlay: { position: "absolute", bottom: 0, left: 0, right: 0 },
  markerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  premiumCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  descriptionText: {
    fontSize: 13,
    color: "#64748B",
    fontStyle: "italic",
    marginTop: 4,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  problemContainer: { flex: 1 },
  badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  typeTag: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentTag: { backgroundColor: "#FEE2E2" },
  typeTagText: { color: "#4338CA", fontSize: 10, fontWeight: "800" },
  urgentText: { color: "#EF4444" },
  distanceText: { fontSize: 11, color: "#94A3B8", marginLeft: 6 },
  problemTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  locationText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
    width: width * 0.45,
  },
  priceTag: { alignItems: "flex-end", minWidth: 60 },
  currency: { fontSize: 10, color: "#94A3B8", fontWeight: "600" },
  amount: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientRow: { flexDirection: "row", alignItems: "center" },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  clientName: {
    fontSize: 13,
    color: "#475569",
    marginLeft: 8,
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 12,
    marginRight: 4,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 12,
  },
  disabledButton: { opacity: 0.6 },
});
