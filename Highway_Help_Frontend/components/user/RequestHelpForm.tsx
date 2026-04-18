import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/theme";
import { uiRadii, uiSpacing } from "@/lib/ui/system";

export default function RequestHelpForm({
  description,
  setDescription,
  problemType,
  setProblemType,
  PROBLEM_TYPES,
  handleRequestHelp,
  cancelRide,
  areaName,
  jobStage,
}: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [isInputModalVisible, setInputModalVisible] = useState(false);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        sectionLabel: {
          fontWeight: "800",
          fontSize: 10,
          color: theme.colors.text.secondary,
          marginBottom: 12,
          letterSpacing: 1.5,
        },
        charCount: {
          fontSize: 10,
          color: theme.colors.text.secondary,
          fontWeight: "700",
        },
      }),
    [theme],
  );

  if (jobStage === "searching") {
    return (
      <View
        style={[
          styles.searchingContainer,
          {
            backgroundColor: theme.colors.card,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}
      >
        <View style={styles.searchingHeader}>
          <View style={styles.searchingStatus}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
            <Text
              style={[
                styles.searchingTitle,
                { color: theme.colors.text.primary },
              ]}
            >
              Finding local helpers...
            </Text>
          </View>

          <TouchableOpacity
            onPress={cancelRide}
            activeOpacity={0.85}
            style={[
              styles.cancelBadge,
              { backgroundColor: theme.isDark ? "#450a0a" : "#FFF1F2" },
            ]}
          >
            <Text style={[styles.cancelBadgeText, { color: "#E11D48" }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.locationPill,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Ionicons
            name="location"
            size={12}
            color={theme.colors.text.secondary}
          />
          <Text
            style={[
              styles.locationSubText,
              { color: theme.colors.text.secondary },
            ]}
          >
            {areaName || "Detecting..."}
          </Text>
        </View>

        <View
          style={[
            styles.searchingBar,
            { backgroundColor: theme.colors.border },
          ]}
        >
          <View
            style={[
              styles.searchingBarFill,
              { backgroundColor: theme.colors.primary },
            ]}
          />
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.wrapper}>
        <BottomSheetScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 20) + 140,
          }}
        >
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <View>
                <Text
                  style={[
                    styles.mainTitle,
                    { color: theme.colors.text.primary },
                  ]}
                >
                  Vehicle Rescue
                </Text>
                <Text
                  style={[
                    styles.subTitle,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Emergency assistance at your location
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={dynamicStyles.sectionLabel}>
                WHAT'S THE PROBLEM?
              </Text>
              <View style={styles.chipGrid}>
                {PROBLEM_TYPES.map((type: string) => {
                  const active = problemType === type;

                  return (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.85}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setProblemType(type);
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: theme.colors.background,
                          borderColor: theme.colors.border,
                        },
                        active && {
                          backgroundColor: theme.colors.text.primary,
                          borderColor: theme.colors.text.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: theme.colors.text.secondary },
                          active && { color: theme.colors.card },
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setInputModalVisible(true);
              }}
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.textAreaDummy,
                  {
                    color: description
                      ? theme.colors.text.primary
                      : theme.colors.text.secondary,
                  },
                ]}
              >
                {description || "Tell the helper what happened..."}
              </Text>

              <View style={styles.inputFooter}>
                <View style={styles.inputFooterLeft}>
                  <Feather
                    name="edit-3"
                    size={14}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.inputFooterLabel,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Add details
                  </Text>
                </View>

                <Text style={dynamicStyles.charCount}>
                  {description.length}/200
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.locationFooter}>
              <View
                style={[
                  styles.locationIconBg,
                  {
                    backgroundColor: theme.isDark ? "#1e1b4b" : "#EEF2FF",
                  },
                ]}
              >
                <Feather
                  name="map-pin"
                  size={12}
                  color={theme.colors.primary}
                />
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.locationFooterText,
                  { color: theme.colors.text.secondary },
                ]}
              >
                {areaName ? areaName : "Detecting your location..."}
              </Text>
            </View>
          </View>
        </BottomSheetScrollView>

        <View
          style={[
            styles.bottomActionWrap,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: theme.colors.card,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.submitBtn,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleRequestHelp}
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
      </View>

      <Modal
        visible={isInputModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setInputModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setInputModalVisible(false)}
        >
          <Pressable>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
              style={styles.keyboardAvoiding}
            >
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: theme.colors.card,
                    paddingBottom: Math.max(insets.bottom, 20),
                  },
                ]}
              >
                <View style={styles.modalHandle} />

                <View style={styles.modalHeader}>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.colors.text.primary },
                    ]}
                  >
                    Description
                  </Text>

                  <TouchableOpacity
                    onPress={() => setInputModalVisible(false)}
                    style={styles.doneBtn}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.doneBtnText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color: theme.colors.text.primary,
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Provide details (e.g., car model, specific issue)..."
                  placeholderTextColor={theme.colors.text.secondary}
                  multiline
                  autoFocus
                  value={description}
                  onChangeText={setDescription}
                  maxLength={200}
                  textAlignVertical="top"
                  returnKeyType="done"
                />

                <View style={styles.modalFooter}>
                  <Text
                    style={[
                      styles.modalCounter,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    {description.length}/200
                  </Text>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    paddingHorizontal: uiSpacing.xl,
    paddingTop: uiSpacing.sm,
  },
  headerRow: {
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: "700",
    fontSize: 13,
  },
  inputWrapper: {
    borderRadius: uiRadii.xl,
    padding: 18,
    borderWidth: 1,
    minHeight: 110,
    justifyContent: "space-between",
  },
  textAreaDummy: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
    minHeight: 52,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  inputFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputFooterLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  locationFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  locationIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  locationFooterText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  bottomActionWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: uiSpacing.xl,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  submitBtn: {
    height: 64,
    borderRadius: uiRadii.xl,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardAvoiding: {
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 14,
    minHeight: "62%",
    maxHeight: "88%",
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#94A3B8",
    opacity: 0.45,
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  doneBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  doneBtnText: {
    fontWeight: "800",
    fontSize: 16,
  },
  modalInput: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 220,
  },
  modalFooter: {
    alignItems: "flex-end",
    marginTop: 12,
  },
  modalCounter: {
    fontSize: 12,
    fontWeight: "700",
  },
  searchingContainer: {
    padding: 24,
    borderRadius: 32,
  },
  searchingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchingStatus: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  searchingTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "800",
  },
  cancelBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cancelBadgeText: {
    fontWeight: "800",
    fontSize: 12,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  locationSubText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  searchingBar: {
    height: 6,
    width: "100%",
    borderRadius: 3,
    marginTop: 25,
    overflow: "hidden",
  },
  searchingBarFill: {
    height: "100%",
    width: "40%",
  },
});
