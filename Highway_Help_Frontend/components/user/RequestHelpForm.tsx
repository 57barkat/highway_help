import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/app/constants/Colors";

export default function RequestHelpForm({
  description,
  setDescription,
  problemType,
  setProblemType,
  PROBLEM_TYPES,
  handleRequestHelp,
  cancelRide,
  currentRequestId,
  areaName,
  jobStage,
}: any) {
  // --- SEARCHING STATE UI ---
  if (jobStage === "searching") {
    return (
      <View style={styles.searchingContainer}>
        <View style={styles.searchingHeader}>
          <View style={styles.searchingStatus}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.searchingTitle}>Finding local helpers...</Text>
          </View>
          <TouchableOpacity onPress={cancelRide} style={styles.cancelBadge}>
            <Text style={styles.cancelBadgeText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.locationPill}>
          <Ionicons name="location" size={12} color={Colors.textSub} />
          <Text style={styles.locationSubText}>
            {areaName || "Detecting..."}
          </Text>
        </View>

        {/* Pulse Effect / Visual cue can go here */}
        <View style={styles.searchingBar}>
          <View style={styles.searchingBarFill} />
        </View>
      </View>
    );
  }

  // --- FORM STATE UI ---
  return (
    <BottomSheetFlatList
      data={[]}
      keyExtractor={() => "form"}
      renderItem={() => null}
      contentContainerStyle={{ paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.mainTitle}>Vehicle Rescue</Text>
              <Text style={styles.subTitle}>
                Emergency assistance at your location
              </Text>
            </View>
            {currentRequestId && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  cancelRide();
                }}
                style={styles.headerCancelBtn}
              >
                <Text style={styles.headerCancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Problem Type Chips */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WHAT'S THE PROBLEM?</Text>
            <View style={styles.chipGrid}>
              {PROBLEM_TYPES.map((type: string) => {
                const active = problemType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setProblemType(type);
                    }}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textArea}
              placeholder="Tell the helper what happened..."
              placeholderTextColor="#94A3B8"
              multiline
              value={description}
              onChangeText={setDescription}
              maxLength={200}
            />
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>

          {/* Location Footer */}
          <View style={styles.locationFooter}>
            <View style={styles.locationIconBg}>
              <Feather name="map-pin" size={12} color={Colors.primary} />
            </View>
            <Text numberOfLines={1} style={styles.locationFooterText}>
              {areaName ? areaName : "Detecting your location..."}
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRequestHelp}
            activeOpacity={0.9}
          >
            <View style={styles.submitBtnContent}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={22}
                color="white"
              />
              <Text style={styles.submitBtnText}>Request Help Now</Text>
            </View>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  headerCancelBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  headerCancelText: {
    color: "#EF4444",
    fontWeight: "800",
    fontSize: 12,
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionLabel: {
    fontWeight: "800",
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 12,
    letterSpacing: 1,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  chipText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 14,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  inputWrapper: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 120,
  },
  textArea: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
    textAlignVertical: "top",
    flex: 1,
  },
  charCount: {
    textAlign: "right",
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
  },
  locationFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  locationIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  locationFooterText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  submitBtn: {
    backgroundColor: "#0F172A",
    height: 64,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  submitBtnContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 18,
    marginLeft: 8,
  },
  // Searching State Styles
  searchingContainer: {
    padding: 24,
    alignItems: "center",
  },
  searchingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  searchingStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchingTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  cancelBadge: {
    backgroundColor: "#FFF1F2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cancelBadgeText: {
    color: "#E11D48",
    fontWeight: "800",
    fontSize: 12,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  locationSubText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginLeft: 4,
  },
  searchingBar: {
    height: 4,
    width: "100%",
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    marginTop: 20,
    overflow: "hidden",
  },
  searchingBarFill: {
    height: "100%",
    width: "30%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
