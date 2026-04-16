import React, { Suspense, lazy, useState } from "react";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Edit2,
  FileText,
  HelpCircle,
  History,
  LogOut,
  LucideIcon,
  Wallet,
} from "lucide-react-native";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHelper } from "@/context/HelperContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusModal } from "@/models/StatusModal";
import { TopUpModal } from "@/components/modals/TopUpModal";

const HelperStatsSection = lazy(
  () => import("../../components/helper/HelperStatsSection"),
);

interface ProfileOptionProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  isWarning?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stats, userLocation, jobStage, setModalConfig, modalConfig } =
    useHelper();

  // Modal State
  const [isTopUpVisible, setIsTopUpVisible] = useState(false);

  const balance = stats?.availableBalance || 0;
  const isNegative = balance < 0;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("app_token");
            await AsyncStorage.removeItem("app_user");
            router.replace("/SignInScreen");
          } catch (error) {
            setModalConfig({
              visible: true,
              title: "Error",
              message: "Failed to logout.",
              type: "error",
            });
          }
        },
      },
    ]);
  };

  const onConfirmPayment = (amount: number) => {
    if (isNaN(amount) || amount < 100) {
      setModalConfig({
        visible: true,
        title: "Invalid Amount",
        message: "Please enter an amount of Rs. 100 or more.",
        type: "error",
      });
      return;
    }
    setIsTopUpVisible(false);
    router.push({ pathname: "/payment", params: { amount: amount } });
  };

  const ProfileOption: React.FC<ProfileOptionProps> = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    color = "#00A99D",
    isWarning = false,
  }) => (
    <TouchableOpacity
      style={[styles.optionCard, isWarning && styles.warningBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.optionIcon,
          { backgroundColor: isWarning ? "#FEF2F2" : `${color}15` },
        ]}
      >
        <Icon size={20} color={isWarning ? "#EF4444" : color} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, isWarning && { color: "#B91C1C" }]}>
          {title}
        </Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={16} color={isWarning ? "#FCA5A5" : "#CBD5E1"} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>ME</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editBadge}
            onPress={() => router.push("../edit-profile")}
          >
            <Edit2 size={16} color="#00A99D" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsCard}>
          <Suspense fallback={<ActivityIndicator color="#00A99D" />}>
            <HelperStatsSection
              userLocation={userLocation}
              jobStage={jobStage}
              stats={stats}
              isProfile={true}
            />
          </Suspense>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <Text style={styles.sectionHeading}>Financials</Text>
        <ProfileOption
          icon={Wallet}
          title={isNegative ? "Clear Dues" : "Top Up Wallet"}
          subtitle={
            isNegative
              ? `Negative Balance: Rs. ${balance}`
              : `Available Credit: Rs. ${balance}`
          }
          isWarning={isNegative}
          color="#10B981"
          onPress={() => setIsTopUpVisible(true)}
        />

        <Text style={styles.sectionHeading}>Manage Account</Text>
        <ProfileOption
          icon={History}
          title="Job History"
          subtitle="Recent service activity"
          onPress={() => router.push("/History")}
        />

        <Text style={styles.sectionHeading}>Support</Text>
        <ProfileOption
          icon={HelpCircle}
          title="Help Center"
          subtitle="FAQs"
          onPress={() => router.push("./support")}
          color="#3B82F6"
        />

        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* TOP UP MODAL */}
      <TopUpModal
        visible={isTopUpVisible}
        onClose={() => setIsTopUpVisible(false)}
        onConfirm={onConfirmPayment}
        initialAmount={isNegative ? Math.abs(balance).toString() : "500"}
      />

      {/* STATUS MODAL */}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#00A99D",
    paddingVertical: 40,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    marginBottom: 45,
    alignItems: "center",
  },
  avatarContainer: { position: "relative", alignItems: "center" },
  avatarGlow: {
    padding: 6,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#00A99D", fontSize: 32, fontWeight: "800" },
  editBadge: {
    position: "absolute",
    right: 0,
    bottom: 5,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 20,
    elevation: 4,
  },
  statsCard: {
    position: "absolute",
    bottom: -35,
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 10,
    elevation: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94A3B8",
    marginTop: 25,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  warningBorder: { borderColor: "#FECACA", backgroundColor: "#FFFBFB" },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  optionSubtitle: { fontSize: 13, color: "#94A3B8" },
  signOutBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
    marginLeft: 10,
  },
});
