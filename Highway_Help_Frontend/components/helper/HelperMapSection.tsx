import React, { memo, useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/context/theme";
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
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for the user's location
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Center map when locations are available
  useEffect(() => {
    if (helperLocation?.lat && userLocation?.lat && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: helperLocation.lat, longitude: helperLocation.lng },
          { latitude: userLocation.lat, longitude: userLocation.lng },
        ],
        {
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
          animated: true,
        },
      );
    }
  }, [userLocation?.lat, helperLocation?.lat]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle}
        initialRegion={{
          latitude: helperLocation?.lat ?? 33.6844,
          longitude: helperLocation?.lng ?? 73.0479,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Helper/Mechanic Marker */}
        {helperLocation?.lat && (
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
                {
                  borderColor: online ? "#10B981" : "#94A3B8",
                  backgroundColor: theme.colors.card,
                },
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
        {userLocation?.lat && (
          <>
            <Marker
              coordinate={{
                latitude: userLocation.lat,
                longitude: userLocation.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.customerMarkerWrapper}>
                <Animated.View
                  style={[
                    styles.customerMarkerPulse,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                />
                <View style={styles.customerMarkerInner} />
              </View>
            </Marker>

            {/* Path Line */}
            <Polyline
              coordinates={[
                { latitude: helperLocation.lat, longitude: helperLocation.lng },
                { latitude: userLocation.lat, longitude: userLocation.lng },
              ]}
              strokeColor={theme.isDark ? "#94A3B8" : "#1E293B"}
              strokeWidth={2.5}
              lineDashPattern={[5, 5]}
            />
          </>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  markerContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  innerMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  customerMarkerWrapper: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  customerMarkerPulse: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.3)",
  },
  customerMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFF",
    elevation: 4,
  },
});

export default memo(HelperMapSection);
