import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import BottomSheet from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useHelper } from "@/context/HelperContext";
import { useTheme } from "@/context/theme";
import { StatusModal } from "@/models/StatusModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HelperHeaderSection from "../../components/helper/HelperHeaderSection";
import HelperWorkflowSection from "../../components/helper/HelperWorkflowSection";
import FinalPriceModal from "../../components/helper/FinalPriceModal";
import HelperBottomSheetSection from "../../components/helper/HelperBottomSheetSection";

const { width } = Dimensions.get("window");

export default function HelperScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  const [cooldowns, setCooldowns] = useState<Record<number, number>>({});
  const [availabilityCollapsed, setAvailabilityCollapsed] = useState(false);
  const screenLog = (label: string, payload?: Record<string, unknown>) => {
    console.log(
      `[helper-screen] ${new Date().toISOString()} ${label}`,
      payload ?? {},
    );
  };

  const {
    online,
    incomingRequests,
    nearbyNotification,
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
    locationReady,
    isBootstrapping,
    socketConnected,
    helperStatusMessage,
    canToggleOnline,
  } = useHelper();

  const visibleRequests = useMemo(() => {
    if (!nearbyNotification) {
      return incomingRequests;
    }

    const existsInList = incomingRequests.some(
      (request) => request.requestId === nearbyNotification.requestId,
    );

    return existsInList
      ? incomingRequests
      : [nearbyNotification, ...incomingRequests];
  }, [incomingRequests, nearbyNotification]);

  useEffect(() => {
    screenLog("render state", {
      online,
      jobStage,
      incomingCount: incomingRequests.length,
      visibleCount: visibleRequests.length,
      incomingIds: incomingRequests.map((request) => request.requestId),
      visibleIds: visibleRequests.map((request) => request.requestId),
      nearbyNotificationId: nearbyNotification?.requestId ?? null,
      selectedRequestId: selectedRequest?.requestId ?? null,
    });
  }, [
    online,
    jobStage,
    incomingRequests,
    visibleRequests,
    nearbyNotification,
    selectedRequest,
  ]);

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

  useEffect(() => {
    const hasCooldowns = Object.values(cooldowns).some((value) => value > 0);
    if (!hasCooldowns) return;

    const interval = setInterval(() => {
      setCooldowns((prev) => {
        const next: Record<number, number> = {};
        Object.entries(prev).forEach(([key, value]) => {
          if (value > 1) next[Number(key)] = value - 1;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldowns]);

  useEffect(() => {
    setAvailabilityCollapsed(online);
  }, [online]);

  const handleOpenRequest = (item: any) => {
    screenLog("handleOpenRequest", {
      requestId: item?.requestId,
      visibleIds: visibleRequests.map((request) => request.requestId),
    });
    setSelectedRequest(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => bottomSheetRef.current?.snapToIndex(0), 100);
  };

  const handleCompletePress = async () => {
    const price = parseFloat(finalAmount);
    if (isNaN(price) || price < agreedPrice) {
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
      case "flat tire":
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
    const isLocked = (cooldowns[item.requestId] || 0) > 0;
    const displayAddress =
      item.areaName ?? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`;

    return (
      <View
        style={[
          styles.premiumCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: theme.isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.03)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={getProblemIcon(item.problemType)}
              size={28}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.problemContainer}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.typeTag,
                  {
                    backgroundColor: theme.isDark
                      ? "rgba(0,255,190,0.1)"
                      : "rgba(0,255,190,0.05)",
                  },
                  item.problemType?.toLowerCase() === "flat tire" && {
                    backgroundColor: "rgba(244,63,94,0.1)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeTagText,
                    { color: theme.colors.primary },
                    item.problemType?.toLowerCase() === "flat tire" && {
                      color: theme.colors.error,
                    },
                  ]}
                >
                  {item.status?.toUpperCase() || "NEW"}
                </Text>
              </View>
              <Text
                style={[
                  styles.distanceText,
                  { color: theme.colors.text.secondary },
                ]}
              >
                • {item.distanceKm?.toFixed(1) ?? "Nearby"} km
              </Text>
            </View>

            <Text
              style={[
                styles.problemTitle,
                { color: theme.colors.text.primary },
              ]}
              numberOfLines={1}
            >
              {item.problemType.replace("_", " ")}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-sharp"
                size={12}
                color={theme.colors.text.disabled}
              />
              <Text
                style={[
                  styles.locationText,
                  { color: theme.colors.text.secondary },
                ]}
                numberOfLines={1}
              >
                {displayAddress}
              </Text>
            </View>

            {item.description && (
              <Text
                style={[
                  styles.descriptionText,
                  {
                    color: theme.colors.text.secondary,
                    backgroundColor: theme.isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                  },
                ]}
                numberOfLines={1}
              >
                "{item.description}"
              </Text>
            )}
          </View>

          <View style={styles.priceTag}>
            <Text
              style={[styles.currency, { color: theme.colors.text.disabled }]}
            >
              PKR
            </Text>
            <Text style={[styles.amount, { color: theme.colors.text.primary }]}>
              {Math.floor(item.suggestedPrice)}
            </Text>
          </View>
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <View style={styles.footerRow}>
          <View style={styles.clientRow}>
            <View
              style={[
                styles.avatarMini,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.avatarLetter}>{item.userName.charAt(0)}</Text>
            </View>
            <Text
              style={[styles.clientName, { color: theme.colors.text.primary }]}
            >
              {item.userName}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.primary },
              isLocked && { opacity: 0.5 },
            ]}
            onPress={() => handleOpenRequest(item)}
            disabled={isLocked}
          >
            <Text style={styles.actionButtonText}>
              {isLocked
                ? `Resend in ${cooldowns[item.requestId]}s`
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
    <GestureHandlerRootView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {jobStage === "idle" ? (
          <>
            <HelperHeaderSection
              online={online}
              toggleOnline={toggleOnline}
              disabled={!canToggleOnline && !online}
              loading={isBootstrapping || !socketConnected}
              statusText={helperStatusMessage}
              collapsed={availabilityCollapsed}
              onToggleCollapsed={() =>
                setAvailabilityCollapsed((current) => !current)
              }
            />
            {nearbyNotification ? (
              <TouchableOpacity
                style={[
                  styles.notificationBanner,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  handleOpenRequest(nearbyNotification);
                }}
              >
                <View style={styles.notificationCopy}>
                  <Text style={styles.notificationEyebrow}>Nearby Request</Text>
                  <Text style={styles.notificationTitle}>
                    {nearbyNotification.problemType} for{" "}
                    {nearbyNotification.userName}
                  </Text>
                  <Text style={styles.notificationMeta}>
                    {nearbyNotification.distanceKm?.toFixed(1) ?? "0"} km away
                  </Text>
                  {(cooldowns[nearbyNotification.requestId] || 0) > 0 ? (
                    <Text style={styles.notificationMeta}>
                      Offer sent. Resend available in{" "}
                      {cooldowns[nearbyNotification.requestId]}s
                    </Text>
                  ) : null}
                </View>
                <Ionicons
                  name="arrow-forward-circle"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            ) : null}
            <FlatList
              data={visibleRequests}
              keyExtractor={(item) => item.requestId.toString()}
              contentContainerStyle={[
                styles.listContainer,
                { paddingBottom: insets.bottom + 24 },
              ]}
              renderItem={renderRequestItem}
              ListEmptyComponent={
                <View style={styles.emptyStateContainer}>
                  <MaterialCommunityIcons
                    name="radar"
                    size={60}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: theme.colors.text.disabled },
                    ]}
                  >
                    {locationReady
                      ? "Scanning nearby requests..."
                      : "Enable location to receive nearby requests"}
                  </Text>
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
              customMapStyle={theme.isDark ? mapDarkStyle : []}
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
                  <View
                    style={[
                      styles.markerCircle,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
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
                      { backgroundColor: theme.colors.error },
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
          cooldownRemaining={
            selectedRequest ? cooldowns[selectedRequest.requestId] || 0 : 0
          }
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
      </View>
    </GestureHandlerRootView>
  );
}

const mapDarkStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: { padding: 16 },
  notificationBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  notificationCopy: { flex: 1 },
  notificationEyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  notificationTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  notificationMeta: { color: "#FFF", fontSize: 12, opacity: 0.9 },
  fullMapContainer: { flex: 1 },
  workflowOverlay: { position: "absolute", bottom: 0, left: 0, right: 0 },
  markerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  premiumCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  descriptionText: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  problemContainer: { flex: 1 },
  badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  typeTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeTagText: { fontSize: 10, fontWeight: "800" },
  distanceText: { fontSize: 11, marginLeft: 6 },
  problemTitle: { fontSize: 18, fontWeight: "800" },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  locationText: { fontSize: 12, marginLeft: 4, width: width * 0.45 },
  priceTag: { alignItems: "flex-end", minWidth: 70 },
  currency: { fontSize: 10, fontWeight: "700" },
  amount: { fontSize: 20, fontWeight: "900" },
  divider: { height: 1, marginVertical: 14 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientRow: { flexDirection: "row", alignItems: "center" },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  clientName: { fontSize: 14, marginLeft: 8, fontWeight: "600" },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
    marginRight: 6,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 120,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
});
