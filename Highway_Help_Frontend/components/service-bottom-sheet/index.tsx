import React, { useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { ServiceCard } from "@/components/service-card";
import { RoadsideService } from "@/lib/services/roadside-api";
import { useTheme } from "@/context/theme";

interface ServiceBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  services: RoadsideService[];
  loading: boolean;
  onServiceSelect: (service: RoadsideService) => void;
  nearbyHelpersCount: number;
}

export const ServiceBottomSheet: React.FC<ServiceBottomSheetProps> = ({
  bottomSheetRef,
  services,
  loading,
  onServiceSelect,
  nearbyHelpersCount,
}) => {
  const { theme } = useTheme();

  // Define snap points for the bottom sheet
  const snapPoints = useMemo(() => ["25%", "50%", "85%"], []);

  // Render each service card
  const renderService = useCallback(
    ({ item }: { item: RoadsideService }) => (
      <ServiceCard
        serviceType={item.type}
        title={item.title}
        description={item.description}
        estimatedTime={item.estimatedTime}
        price={item.price}
        available={item.available}
        onPress={() => onServiceSelect(item)}
      />
    ),
    [onServiceSelect]
  );

  // Header component
  const renderHeader = useCallback(
    () => (
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text
          style={[styles.headerTitle, { color: theme.colors.text.primary }]}
        >
          Roadside Assistance
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            { color: theme.colors.text.secondary },
          ]}
        >
          {nearbyHelpersCount > 0
            ? `${nearbyHelpersCount} helpers nearby`
            : "Finding helpers..."}
        </Text>
      </View>
    ),
    [theme, nearbyHelpersCount]
  );

  // Empty state component
  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text
          style={[styles.emptyText, { color: theme.colors.text.secondary }]}
        >
          {loading
            ? "Loading services..."
            : "No services available in your area"}
        </Text>
      </View>
    ),
    [loading, theme]
  );

  // Footer component with loading indicator
  const renderFooter = useCallback(
    () =>
      loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.text.secondary }]}
          >
            Finding available services...
          </Text>
        </View>
      ) : null,
    [loading, theme]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      backgroundStyle={[
        styles.bottomSheetBackground,
        { backgroundColor: theme.colors.background },
      ]}
      handleIndicatorStyle={[
        styles.handleIndicatorStyle,
        { backgroundColor: theme.colors.border },
      ]}
      accessible={true}
      accessibilityLabel="Service selection bottom sheet"
    >
      <View
        style={[
          styles.contentContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        {renderHeader()}
        <BottomSheetFlatList
          data={services}
          renderItem={renderService}
          keyExtractor={(item: RoadsideService) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          accessible={true}
          accessibilityLabel="List of available roadside services"
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
  },
  handleIndicatorStyle: {
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CCCCCC",
    alignSelf: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});

export default ServiceBottomSheet;
