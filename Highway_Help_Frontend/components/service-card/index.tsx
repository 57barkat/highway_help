import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AccessibilityInfo,
} from "react-native";
import { SERVICE_TYPES, ServiceType } from "@/lib/types";
import { IconSymbol } from "@/components/icon-symbol";
import { useTheme } from "@/context/theme";

interface ServiceCardProps {
  serviceType: ServiceType;
  title: string;
  description: string;
  estimatedTime: string;
  price: string;
  available: boolean;
  onPress: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  serviceType,
  title,
  description,
  estimatedTime,
  price,
  available,
  onPress,
}) => {
  const { theme } = useTheme();
  const serviceInfo = SERVICE_TYPES[serviceType];

  const handlePress = () => {
    if (available) {
      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(
        `${title} selected. ${description}. Estimated time: ${estimatedTime}.`
      );
      onPress();
    } else {
      AccessibilityInfo.announceForAccessibility(
        `${title} is currently unavailable in your area.`
      );
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          opacity: available ? 1 : 0.5,
        },
      ]}
      onPress={handlePress}
      disabled={!available}
      accessible={true}
      accessibilityLabel={`${title}. ${description}. Estimated time: ${estimatedTime}. Price: ${price}.${
        available ? " Tap to select." : " Currently unavailable."
      }`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !available }}
    >
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: available
                ? theme.colors.primaryLight + "20"
                : theme.colors.surface,
            },
          ]}
        >
          <IconSymbol
            name={serviceInfo.icon as any}
            size={32}
            color={
              available ? theme.colors.primary : theme.colors.text.disabled
            }
            library={serviceInfo.library}
          />
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              {
                color: available
                  ? theme.colors.text.primary
                  : theme.colors.text.disabled,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {!available && (
            <View
              style={[
                styles.unavailableBadge,
                { backgroundColor: theme.colors.error },
              ]}
            >
              <Text style={styles.unavailableText}>Unavailable</Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.description, { color: theme.colors.text.secondary }]}
          numberOfLines={2}
        >
          {description}
        </Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text
              style={[
                styles.detailLabel,
                { color: theme.colors.text.secondary },
              ]}
            >
              Time:
            </Text>
            <Text
              style={[styles.detailValue, { color: theme.colors.text.primary }]}
            >
              {estimatedTime}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text
              style={[
                styles.detailLabel,
                { color: theme.colors.text.secondary },
              ]}
            >
              Price:
            </Text>
            <Text
              style={[
                styles.detailValue,
                styles.priceText,
                { color: theme.colors.primary },
              ]}
            >
              {price}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: "center",
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  unavailableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  unavailableText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  detailLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  priceText: {
    fontWeight: "700",
  },
});

export default ServiceCard;
