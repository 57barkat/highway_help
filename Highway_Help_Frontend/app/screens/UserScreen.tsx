import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  View,
  StatusBar,
  StyleSheet,
  FlatList,
  Text,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRescueRequest } from "../hooks/useRescueRequest";
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

const { width } = Dimensions.get("window");

export default function UserScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
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
  } = useRescueRequest();

  useEffect(() => {
    (async () => {
      if (userLocation?.lat && userLocation?.lng) {
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
    if (jobStage === "searching") return ["15%"];
    return ["55%", "90%"];
  }, [jobStage]);

  const handleRequestHelp = async () => {
    if (!description) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    await requestHelp(description, problemType || "general", areaName);
  };

  const handleDismissOffer = (id: number) => {
    setVisibleOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const handleAccept = async (id: number) => {
    await acceptOffer(id);
  };

  if (!userLocation) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading Map...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={mapStyle}
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
        <View style={localStyles.floatingOfferContainer}>
          <View style={localStyles.offerHeaderFloating}>
            <View style={localStyles.pulse} />
            <Text style={localStyles.floatingTitle}>Nearby Offers Found</Text>
          </View>
          <FlatList
            data={visibleOffers}
            keyExtractor={(item: any) => item.id.toString()}
            // Removed horizontal prop
            // Removed showsHorizontalScrollIndicator
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: 20,
              paddingHorizontal: 20,
            }}
            // Removed snapToInterval and decelerationRate as they are usually for carousels
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
        handleIndicatorStyle={{
          backgroundColor: "#E2E8F0",
          width: 50,
          height: 5,
        }}
        backgroundStyle={{ borderRadius: 32, elevation: 20 }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          {jobStage === "active" ? (
            <ActiveRideView cancelRide={cancelRide} />
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

const localStyles = StyleSheet.create({
  floatingOfferContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: 10,
  },
  offerHeaderFloating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#059669",
    marginLeft: 8,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
});
