import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MapPin, Clock } from "lucide-react-native";
import { LocationSuggestion } from "@/lib/services/location-autocomplete";
import { useTheme } from "@/context/theme";

interface SearchAutocompleteProps {
  suggestions: LocationSuggestion[];
  loading: boolean;
  onSelectLocation: (location: LocationSuggestion) => void;
  visible: boolean;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  suggestions,
  loading,
  onSelectLocation,
  visible,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  const renderSuggestion = ({ item }: { item: LocationSuggestion }) => (
    <TouchableOpacity
      style={[
        styles.suggestionItem,
        { borderBottomColor: theme.colors.border },
      ]}
      onPress={() => onSelectLocation(item)}
      accessible={true}
      accessibilityLabel={`${item.name}, ${item.address}`}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.primary + "15" },
        ]}
      >
        {item.type === "landmark" ? (
          <MapPin size={18} color={theme.colors.primary} />
        ) : (
          <Clock size={18} color={theme.colors.text.secondary} />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[styles.suggestionName, { color: theme.colors.text.primary }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={[
            styles.suggestionAddress,
            { color: theme.colors.text.secondary },
          ]}
          numberOfLines={1}
        >
          {item.address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.text.secondary }]}
          >
            Searching...
          </Text>
        </View>
      ) : suggestions.length > 0 ? (
        <FlatList
          data={suggestions}
          renderItem={renderSuggestion}
          keyExtractor={(item) => item.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 250,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  list: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  suggestionAddress: {
    fontSize: 13,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default SearchAutocomplete;
