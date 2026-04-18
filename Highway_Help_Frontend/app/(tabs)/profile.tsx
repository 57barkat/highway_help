import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  HelpCircle,
  History,
  MessageCircle,
  Phone,
  Wallet,
} from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHelper } from "@/context/HelperContext";
import { useTheme } from "@/context/theme";
import { StatusModal } from "@/models/StatusModal";
import { TopUpModal } from "@/components/modals/TopUpModal";
import { getStoredUser } from "@/lib/auth-storage";
import { darkUiColors, lightUiColors, uiRadii, uiShadows, uiSpacing } from "@/lib/ui/system";

type ProfileOptionProps = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  subtitle?: string;
  onPress: () => void;
  tone?: string;
  isWarning?: boolean;
};

type ProfileSection = {
  title: string;
  items: ProfileOptionProps[];
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const palette = theme.isDark ? darkUiColors : lightUiColors;
  const { stats, setModalConfig, modalConfig } = useHelper();
  const [userProfile, setUserProfile] = useState<{
    name?: string;
    email?: string;
    phoneNumber?: string | null;
    role?: "user" | "helper";
  } | null>(null);
  const [isTopUpVisible, setIsTopUpVisible] = useState(false);

  const balance = stats?.availableBalance || 0;
  const isNegative = balance < 0;

  useEffect(() => {
    const loadStoredUser = async () => {
      const rawUser = await getStoredUser();
      if (rawUser) {
        setUserProfile(JSON.parse(rawUser));
      }
    };

    loadStoredUser();
  }, []);

  const profileSections = useMemo<ProfileSection[]>(() => {
    const base: ProfileSection[] = [
      {
        title: "Activity",
        items: [
          {
            icon: History,
            title: "Service History",
            subtitle: "Review recent rides, prices, and job outcomes",
            onPress: () => router.push("/History"),
          },
          {
            icon:
              userProfile?.role === "helper" ? HelpCircle : MessageCircle,
            title:
              userProfile?.role === "helper"
                ? "Helper Support"
                : "Emergency Support",
            subtitle:
              userProfile?.role === "helper"
                ? "Read guidance and escalation options"
                : "Quick access to helplines and support",
            onPress: () => router.push("/(tabs)/support"),
            tone: palette.info,
          },
        ],
      },
    ];

    if (userProfile?.role === "helper") {
      base.unshift({
        title: "Wallet",
        items: [
          {
            icon: Wallet,
            title: isNegative ? "Clear dues" : "Top up wallet",
            subtitle: isNegative
              ? `Outstanding balance: Rs ${Math.abs(balance).toFixed(0)}`
              : `Available credit: Rs ${balance.toFixed(0)}`,
            onPress: () => setIsTopUpVisible(true),
            tone: isNegative ? palette.danger : palette.success,
            isWarning: isNegative,
          },
        ],
      });
    } else {
      base.unshift({
        title: "Account",
        items: [
          {
            icon: Phone,
            title: "Registered mobile",
            subtitle: userProfile?.phoneNumber || "No mobile number saved",
            onPress: () => {},
            tone: palette.success,
          },
        ],
      });
    }

    return base;
  }, [balance, isNegative, palette.danger, palette.info, palette.success, router, userProfile?.phoneNumber, userProfile?.role]);

  const onConfirmPayment = (amount: number) => {
    if (isNaN(amount) || amount < 100) {
      setModalConfig({
        visible: true,
        title: "Invalid amount",
        message: "Enter an amount of Rs 100 or more to continue.",
        type: "warning",
      });
      return;
    }

    setIsTopUpVisible(false);
    router.push({ pathname: "/payment", params: { amount } });
  };

  const ProfileOption = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    tone,
    isWarning = false,
  }: ProfileOptionProps) => (
    <TouchableOpacity
      style={[
        styles.optionCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: isWarning ? `${palette.danger}55` : theme.colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View
        style={[
          styles.optionIcon,
          {
            backgroundColor: `${tone ?? theme.colors.primary}18`,
          },
        ]}
      >
        <Icon size={20} color={tone ?? theme.colors.primary} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, { color: theme.colors.text.primary }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.optionSubtitle, { color: theme.colors.text.secondary }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={theme.colors.text.secondary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: uiSpacing.lg,
          paddingTop: uiSpacing.lg,
          paddingBottom: insets.bottom + uiSpacing.xxl,
        }}
      >
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.heroAccent,
              {
                backgroundColor: theme.isDark ? palette.sidebarCard : "#DDF4F2",
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.avatarText}>
                {(userProfile?.name?.slice(0, 2) || "HH").toUpperCase()}
              </Text>
            </View>
            <View style={styles.identityBlock}>
              <Text style={[styles.identityTitle, { color: theme.colors.text.primary }]}>
                {userProfile?.name || "Highway Help Member"}
              </Text>
              <Text
                style={[styles.identityMeta, { color: theme.colors.text.secondary }]}
              >
                {userProfile?.email || "No email saved"}
              </Text>
              <Text
                style={[styles.identityMeta, { color: theme.colors.text.secondary }]}
              >
                {userProfile?.phoneNumber || "No mobile number saved"}
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View
              style={[
                styles.metricCard,
                { backgroundColor: theme.isDark ? theme.colors.surface : "#F7FBFC" },
              ]}
            >
              <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
                Role
              </Text>
              <Text style={[styles.metricValue, { color: theme.colors.text.primary }]}>
                {userProfile?.role === "helper" ? "Helper" : "User"}
              </Text>
            </View>
            <View
              style={[
                styles.metricCard,
                { backgroundColor: theme.isDark ? theme.colors.surface : "#F7FBFC" },
              ]}
            >
              <Text style={[styles.metricLabel, { color: theme.colors.text.secondary }]}>
                Wallet
              </Text>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color: isNegative ? palette.danger : theme.colors.text.primary,
                  },
                ]}
              >
                Rs {balance.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>

        {profileSections.map((section) => (
          <View key={section.title} style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: theme.colors.text.secondary }]}>
              {section.title}
            </Text>
            {section.items.map((item) => (
              <ProfileOption key={item.title} {...item} />
            ))}
          </View>
        ))}

      </ScrollView>

      {userProfile?.role === "helper" ? (
        <TopUpModal
          visible={isTopUpVisible}
          onClose={() => setIsTopUpVisible(false)}
          onConfirm={onConfirmPayment}
          initialAmount={isNegative ? Math.abs(balance).toString() : "500"}
        />
      ) : null}

      {modalConfig ? (
        <StatusModal
          visible={modalConfig.visible}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          onClose={() => setModalConfig(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroCard: {
    borderWidth: 1,
    borderRadius: uiRadii.xxl,
    padding: uiSpacing.lg,
    ...uiShadows.card,
  },
  heroAccent: {
    borderRadius: uiRadii.xl,
    padding: uiSpacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  identityBlock: {
    flex: 1,
    marginLeft: uiSpacing.md,
  },
  identityTitle: {
    fontSize: 22,
    fontWeight: "800",
  },
  identityMeta: {
    marginTop: 4,
    fontSize: 13,
  },
  metricRow: {
    flexDirection: "row",
    gap: uiSpacing.sm,
    marginTop: uiSpacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: uiRadii.lg,
    padding: uiSpacing.md,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionWrap: {
    marginTop: uiSpacing.xl,
  },
  sectionHeading: {
    marginBottom: uiSpacing.sm,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: uiRadii.xl,
    padding: uiSpacing.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: uiSpacing.sm,
    ...uiShadows.soft,
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
    marginLeft: uiSpacing.md,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  optionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
});

