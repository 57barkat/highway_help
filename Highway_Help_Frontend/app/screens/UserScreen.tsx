import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRescueRequest } from "../hooks/useRescueRequest.stable";
import { styles, mapStyle } from "../../components/user/UserStyles";
import {
  UserMarker,
  MechanicMarker,
  RatingOverlay,
} from "../../components/user/UserSubComponents";
import RequestHelpForm from "../../components/user/RequestHelpForm";
import ActiveRideView from "../../components/user/ActiveRideView";
import { OfferCard } from "../../components/user/OfferCard";
import { StatusModal } from "@/models/StatusModal";
import { useTheme } from "@/context/theme";

export default function UserScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const lastGeocodeRef = useRef<string | null>(null);
  const { theme } = useTheme();

  const [description, setDescription] = useState("");
  const [ratingValue, setRatingValue] = useState(0);
  const [visibleOffers, setVisibleOffers] = useState<any[]>([]);
  const [problemType, setProblemType] = useState<string | null>(null);
  const [areaName, setAreaName] = useState<string>("");

  const PROBLEM_TYPES = [
    "Flat Tire",
    "Battery Jump",
    "Engine Issue",
    "Fuel Delivery",
    "Tow Required",
    "Locked Out",
    "General Help",
  ];

  const {
    userLocation,
    hasLocationPermission,
    isLocationLoading,
    onlineMechanics,
    offers,
    isSearching,
    jobStage,
    ratingVisible,
    requestHelp,
    acceptOffer,
    submitRating,
    currentRequestId,
    cancelRide,
    navigationData,
    modalConfig,
    setModalConfig,
    requestLocationAccess,
  } = useRescueRequest();

  useEffect(() => {
    (async () => {
      if (userLocation?.lat && userLocation?.lng) {
        const geocodeKey = `${userLocation.lat.toFixed(3)}:${userLocation.lng.toFixed(3)}`;
        if (lastGeocodeRef.current === geocodeKey) return;

        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          });

          if (reverseGeocode.length > 0) {
            const addr = reverseGeocode[0];
            const fullAddress = [
              addr.name,
              addr.street,
              addr.district,
              addr.city,
            ]
              .filter((item) => item && item.trim().length > 0)
              .join(", ");

            setAreaName(fullAddress || "Unknown Location");
            lastGeocodeRef.current = geocodeKey;
          }
        } catch (error) {}
      }
    })();
  }, [userLocation]);

  useEffect(() => {
    if (jobStage === "active" || jobStage === "idle") {
      setVisibleOffers([]);
    } else {
      setVisibleOffers(offers || []);
    }

    if (jobStage === "searching") {
      bottomSheetRef.current?.snapToIndex(0);
    }
  }, [offers, jobStage]);

  const snapPoints = useMemo(() => {
    if (jobStage === "active") return ["40%"];
    if (jobStage === "searching") return ["18%"];
    return ["55%", "90%"];
  }, [jobStage]);

  const handleRequestHelp = async () => {
    if (!description) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    await requestHelp(description, problemType || "General Help", areaName);
  };

  const handleDismissOffer = (id: number) => {
    setVisibleOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const handleAccept = async (id: number) => {
    await acceptOffer(id);
  };

  if (!userLocation) {
    return (
      <View
        style={[
          localStyles.loadingState,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={[
            localStyles.loadingTitle,
            { color: theme.colors.text.primary },
          ]}
        >
          {isLocationLoading
            ? "Getting your live location..."
            : "Location access needed"}
        </Text>
        <Text
          style={[
            localStyles.loadingCopy,
            { color: theme.colors.text.secondary },
          ]}
        >
          {hasLocationPermission
            ? "We need your current location before showing nearby helpers."
            : "Enable location to view the map and request nearby roadside help."}
        </Text>
        {!isLocationLoading && (
          <TouchableOpacity
            style={[
              localStyles.locationButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={requestLocationAccess}
          >
            <Text style={localStyles.locationButtonText}>Enable Location</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={theme.isDark ? mapDarkStyle : mapStyle}
        initialRegion={{
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {userLocation?.lat && userLocation?.lng && (
          <Marker
            coordinate={{
              latitude: userLocation.lat,
              longitude: userLocation.lng,
            }}
          >
            <UserMarker />
          </Marker>
        )}

        {onlineMechanics?.map((m: any) => {
          if (!m?.lat || !m?.lng) return null;
          return (
            <Marker
              key={`mech-${m.userId}`}
              coordinate={{
                latitude: parseFloat(m.lat),
                longitude: parseFloat(m.lng),
              }}
            >
              <MechanicMarker />
            </Marker>
          );
        })}

        {jobStage === "active" && navigationData?.helperLocation && (
          <Marker
            key="active-rider"
            coordinate={{
              latitude: parseFloat(navigationData.helperLocation.lat),
              longitude: parseFloat(navigationData.helperLocation.lng),
            }}
          >
            <MechanicMarker />
          </Marker>
        )}
      </MapView>

      {visibleOffers.length > 0 && jobStage === "searching" && (
        <View
          style={[localStyles.floatingOfferContainer, { top: insets.top + 20 }]}
        >
          <View
            style={[
              localStyles.offerHeaderFloating,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View
              style={[
                localStyles.pulse,
                { backgroundColor: theme.colors.success },
              ]}
            />
            <Text
              style={[
                localStyles.floatingTitle,
                { color: theme.colors.success },
              ]}
            >
              Nearby Offers Found
            </Text>
          </View>
          <FlatList
            data={visibleOffers}
            keyExtractor={(item: any) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
            renderItem={({ item }) => (
              <OfferCard
                item={item}
                onAccept={handleAccept}
                onDismiss={handleDismissOffer}
              />
            )}
          />
        </View>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        topInset={insets.top + 10}
        bottomInset={insets.bottom + 10}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        handleIndicatorStyle={{
          backgroundColor: theme.colors.border,
          width: 40,
        }}
        backgroundStyle={{
          borderRadius: 32,
          backgroundColor: theme.colors.card,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.colors.border,
        }}
      >
        <BottomSheetView style={{ flex: 1, paddingHorizontal: 4 }}>
          {jobStage === "active" ? (
            <ActiveRideView
              cancelRide={cancelRide}
              navigationData={navigationData}
            />
          ) : (
            <RequestHelpForm
              description={description}
              setDescription={setDescription}
              problemType={problemType}
              setProblemType={setProblemType}
              PROBLEM_TYPES={PROBLEM_TYPES}
              isSearching={isSearching}
              handleRequestHelp={handleRequestHelp}
              cancelRide={cancelRide}
              currentRequestId={currentRequestId}
              areaName={areaName}
              jobStage={jobStage}
            />
          )}
        </BottomSheetView>
      </BottomSheet>

      {modalConfig && (
        <StatusModal
          visible={modalConfig.visible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={() => setModalConfig(null)}
        />
      )}

      <RatingOverlay
        visible={!!ratingVisible}
        ratingValue={ratingValue || 0}
        onRate={(val: number) => setRatingValue(val)}
        onSubmit={(val: number) => submitRating(val)}
      />
    </GestureHandlerRootView>
  );
}

const mapDarkStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
];

const localStyles = StyleSheet.create({
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingTitle: { marginTop: 16, fontSize: 22, fontWeight: "900" },
  loadingCopy: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  locationButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  locationButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  floatingOfferContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
  },
  offerHeaderFloating: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingTitle: { fontSize: 14, fontWeight: "900", marginLeft: 8 },
  pulse: { width: 10, height: 10, borderRadius: 5 },
});
