import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Headphones,
  History,
  Home,
  LogOut,
  Menu,
  MoonStar,
  SunMedium,
  User,
  ChevronRight,
} from "lucide-react-native";
import { useAuth } from "@/context/auth";
import { ThemeMode, useTheme } from "@/context/theme";
import { darkUiColors, lightUiColors } from "@/lib/ui/system";

type NavigationItem = {
  label: string;
  route: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  helperOnly?: boolean;
  userOnly?: boolean;
};

const NAV_ITEMS: NavigationItem[] = [
  { label: "Dashboard", route: "/(tabs)", icon: Home },
  { label: "History", route: "/History", icon: History },
  {
    label: "Support",
    route: "/(tabs)/support",
    icon: Headphones,
    userOnly: true,
  },
  { label: "Profile", route: "/(tabs)/profile", icon: User },
];

const getScreenTitle = (
  pathname: string,
  role: "user" | "helper" | undefined,
) => {
  if (pathname.includes("/profile")) return "My Account";
  if (pathname.includes("/support")) return "Emergency Hub";
  if (pathname.includes("/History")) return "Service Logs";
  return role === "helper" ? "Dispatch Center" : "Roadside Rescue";
};

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();
  const { mode, setMode, theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLargeScreen = width >= 1024;
  const isTablet = width >= 768;
  const palette = theme.isDark ? darkUiColors : lightUiColors;
  const isDark = theme.isDark;

  useEffect(() => {
    if (isLargeScreen) setMobileOpen(false);
  }, [isLargeScreen, pathname]);

  const navItems = useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (item.helperOnly && user?.role !== "helper") return false;
        if (item.userOnly && user?.role !== "user") return false;
        return true;
      }),
    [user?.role],
  );

  const cycleThemeMode = () => {
    const order: ThemeMode[] = ["light", "dark", "auto"];
    setMode(order[(order.indexOf(mode) + 1) % order.length]);
  };

  const sidebarSurface = "rgba(255,255,255,0.06)";
  const sidebarBorder = "rgba(255,255,255,0.10)";
  const sidebarMuted = "rgba(255,255,255,0.68)";
  const sidebarSoft = "rgba(255,255,255,0.50)";
  const headerButtonBackground = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(15,23,42,0.05)";
  const headerButtonBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(15,23,42,0.08)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";

  const renderNavItem = (item: NavigationItem) => {
    const active =
      item.route === "/(tabs)"
        ? pathname === "/(tabs)" || pathname === "/"
        : pathname.startsWith(item.route.replace("/(tabs)", ""));

    return (
      <TouchableOpacity
        key={item.route}
        activeOpacity={0.85}
        style={[
          styles.navItem,
          {
            backgroundColor: active ? "rgba(255,255,255,0.10)" : "transparent",
            borderColor: active ? "rgba(255,255,255,0.14)" : "transparent",
          },
        ]}
        onPress={() => {
          setMobileOpen(false);
          router.push(item.route as never);
        }}
      >
        <View
          style={[
            styles.navIconWrap,
            {
              backgroundColor: active
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.04)",
            },
          ]}
        >
          <item.icon
            size={19}
            color={active ? theme.colors.primary : sidebarMuted}
            strokeWidth={active ? 2.4 : 2}
          />
        </View>

        <View style={styles.navTextWrap}>
          <Text
            style={[
              styles.navLabel,
              { color: active ? "#FFFFFF" : sidebarMuted },
            ]}
          >
            {item.label}
          </Text>
        </View>

        {active ? (
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: theme.colors.primary },
            ]}
          />
        ) : (
          <ChevronRight size={16} color={sidebarSoft} />
        )}
      </TouchableOpacity>
    );
  };

  const SidebarContent = (
    <SafeAreaView
      style={[
        styles.sidebar,
        {
          backgroundColor: palette.sidebar,
          borderRightColor: isLargeScreen ? theme.colors.border : "transparent",
        },
      ]}
      edges={["left", "top", "bottom"]}
    >
      <View style={styles.sidebarInner}>
        <View style={styles.brandCard}>
          <View
            style={[
              styles.logoWrap,
              { backgroundColor: "rgba(255,255,255,0.08)" },
            ]}
          >
            <View
              style={[
                styles.logoPlaceholder,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.logoText}>H</Text>
            </View>
          </View>

          <View style={styles.brandTextWrap}>
            <Text style={styles.brandTitle}>Highway</Text>
            <Text style={styles.brandSubtitle}>Smart Assist Platform</Text>
          </View>
        </View>

        <View
          style={[
            styles.navCard,
            {
              backgroundColor: sidebarSurface,
              borderColor: sidebarBorder,
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: sidebarSoft }]}>
            Navigation
          </Text>
          <View style={styles.navList}>{navItems.map(renderNavItem)}</View>
        </View>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.footerButton,
              {
                backgroundColor: sidebarSurface,
                borderColor: sidebarBorder,
              },
            ]}
            onPress={cycleThemeMode}
          >
            <View style={styles.footerButtonLeft}>
              <View style={styles.footerIconWrap}>
                {isDark ? (
                  <MoonStar size={18} color={theme.colors.primary} />
                ) : (
                  <SunMedium size={18} color="#FFCC00" />
                )}
              </View>
              <View>
                <Text style={styles.footerTitle}>Appearance</Text>
                <Text style={styles.footerSubtitle}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)} mode
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={sidebarSoft} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.footerButton,
              {
                backgroundColor: sidebarSurface,
                borderColor: sidebarBorder,
              },
            ]}
            onPress={async () => {
              await logout();
              setMobileOpen(false);
              router.replace("/SignInScreen");
            }}
          >
            <View style={styles.footerButtonLeft}>
              <View style={styles.footerIconWrap}>
                <LogOut size={18} color="#FF8E7D" />
              </View>
              <View>
                <Text style={styles.footerTitle}>Logout</Text>
                <Text style={styles.footerSubtitle}>Securely sign out</Text>
              </View>
            </View>
            <ChevronRight size={16} color={sidebarSoft} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {isLargeScreen ? (
        SidebarContent
      ) : (
        <Modal
          visible={mobileOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMobileOpen(false)}
        >
          <View style={styles.modalRoot}>
            <Pressable
              style={styles.backdrop}
              onPress={() => setMobileOpen(false)}
            />
            <View style={styles.mobileSidebarHost}>{SidebarContent}</View>
          </View>
        </Modal>
      )}

      <View style={styles.contentColumn}>
        <SafeAreaView
          edges={["top"]}
          style={[
            styles.topBar,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: cardBorder,
              paddingHorizontal: isTablet ? 24 : 16,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            {!isLargeScreen && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: headerButtonBackground,
                    borderColor: headerButtonBorder,
                  },
                ]}
                onPress={() => setMobileOpen(true)}
              >
                <Menu
                  size={22}
                  color={theme.colors.text.primary}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
            )}

            <View
              style={[
                styles.titleContainer,
                { marginLeft: !isLargeScreen ? 14 : 0 },
              ]}
            >
              <Text
                style={[
                  styles.headerGreeting,
                  { color: theme.colors.text.secondary },
                ]}
                numberOfLines={1}
              >
                {user?.role === "helper" ? "Helper workspace" : "Welcome back"}
              </Text>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.text.primary },
                ]}
                numberOfLines={1}
              >
                {getScreenTitle(pathname, user?.role)}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.iconButton,
                styles.headerActionButton,
                {
                  backgroundColor: headerButtonBackground,
                  borderColor: headerButtonBorder,
                },
              ]}
              onPress={cycleThemeMode}
            >
              {isDark ? (
                <SunMedium size={20} color="#FFCC00" />
              ) : (
                <MoonStar size={20} color={theme.colors.text.secondary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/(tabs)/profile" as never)}
              style={[
                styles.avatarContainer,
                {
                  backgroundColor: headerButtonBackground,
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <View
                style={[
                  styles.avatarInner,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                <User size={18} color={theme.colors.text.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View style={styles.screenContainer}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  contentColumn: {
    flex: 1,
  },
  sidebar: {
    width: 312,
    height: "100%",
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRightWidth: 1,
  },
  sidebarInner: {
    flex: 1,
  },
  brandCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 22,
  },
  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 20,
  },
  brandTextWrap: {
    flex: 1,
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  navCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 14,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  navList: {
    gap: 8,
  },
  navItem: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navTextWrap: {
    flex: 1,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  sidebarFooter: {
    marginTop: "auto",
    gap: 12,
    paddingTop: 18,
  },
  footerButton: {
    minHeight: 70,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  footerTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  footerSubtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  modalRoot: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.56)",
  },
  mobileSidebarHost: {
    width: 312,
    height: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 24,
  },
  topBar: {
    minHeight: 96,
    borderBottomWidth: 1,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerGreeting: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActionButton: {
    marginRight: 10,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1.6,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  screenContainer: {
    flex: 1,
  },
});

export default AppShell;
