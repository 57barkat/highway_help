import React, { memo, useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { mapStyle } from "../../components/helper/HelperStyles";

interface Props {
  helperLocation: any;
  userLocation: any;
  jobStage: string;
  online: boolean;
}

export function HelperMapSection({
  helperLocation,
  userLocation,
  jobStage,
  online,
}: Props) {
  const mapRef = useRef<MapView>(null);

  // Focus logic: Whenever userLocation changes, re-center the map to show both points
  useEffect(() => {
    if (helperLocation && userLocation && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: helperLocation.lat, longitude: helperLocation.lng },
          { latitude: userLocation.lat, longitude: userLocation.lng },
        ],
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        },
      );
    }
  }, [userLocation?.lat, userLocation?.lng]); // Depend on user location to refresh view

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      provider={PROVIDER_GOOGLE}
      customMapStyle={mapStyle}
      initialRegion={{
        latitude: helperLocation?.lat ?? 33.6844,
        longitude: helperLocation?.lng ?? 73.0479,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {/* Mechanic Marker */}
      {helperLocation && (
        <Marker
          coordinate={{
            latitude: helperLocation.lat,
            longitude: helperLocation.lng,
          }}
          flat
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View
            style={[
              styles.markerContainer,
              { borderColor: online ? "#10B981" : "#94A3B8" },
            ]}
          >
            <View
              style={[
                styles.innerMarker,
                { backgroundColor: online ? "#10B981" : "#94A3B8" },
              ]}
            >
              <MaterialCommunityIcons name="moped" size={18} color="#FFF" />
            </View>
          </View>
        </Marker>
      )}

      {/* User/Customer Marker */}
      {userLocation && (
        <>
          <Marker
            coordinate={{
              latitude: userLocation.lat,
              longitude: userLocation.lng,
            }}
          >
            <View style={styles.customerMarkerOuter}>
              <View style={styles.customerMarkerInner} />
            </View>
          </Marker>

          {/* Premium Polyline */}
          <Polyline
            coordinates={[
              { latitude: helperLocation.lat, longitude: helperLocation.lng },
              { latitude: userLocation.lat, longitude: userLocation.lng },
            ]}
            strokeColor="#1E293B"
            strokeWidth={3}
            lineDashPattern={[2, 10]}
          />
        </>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  innerMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  customerMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  customerMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFF",
  },
});

export default memo(HelperMapSection);
