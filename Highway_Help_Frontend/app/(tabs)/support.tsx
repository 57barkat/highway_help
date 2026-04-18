import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Dimensions,
  Platform,
} from "react-native";
import {
  ShieldAlert,
  Ambulance,
  Flame,
  Truck,
  PhoneCall,
  ShieldCheck,
  HeartPulse,
} from "lucide-react-native";
import { useTheme } from "@/context/theme";
import { uiRadii, uiShadows, uiSpacing } from "@/lib/ui/system";

const EMERGENCY_DATA = [
  {
    id: "1",
    title: "Rescue 1122",
    sub: "Ambulance & Fire",
    num: "1122",
    color: "#E11D48",
    icon: Ambulance,
  },
  {
    id: "2",
    title: "Police",
    sub: "Pucar 15",
    num: "15",
    color: "#1E40AF",
    icon: ShieldAlert,
  },
  {
    id: "3",
    title: "Motorway Police",
    sub: "NH&MP Help",
    num: "130",
    color: "#047857",
    icon: Truck,
  },
  {
    id: "4",
    title: "Edhi Service",
    sub: "Ambulance",
    num: "115",
    color: "#F59E0B",
    icon: HeartPulse,
  },
  {
    id: "5",
    title: "Fire Brigade",
    sub: "Emergency",
    num: "16",
    color: "#EA580C",
    icon: Flame,
  },
  {
    id: "6",
    title: "Cyber Crime",
    sub: "FIA Helpline",
    num: "1991",
    color: "#6D28D9",
    icon: ShieldCheck,
  },
];

const SupportScreen = () => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const numColumns = 2;

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[styles.headerTitle, { color: theme.colors.text.primary }]}
        >
          Emergency Helplines
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            { color: theme.colors.text.secondary },
          ]}
        >
          Tap any card to call immediately
        </Text>
      </View>

      <FlatList
        data={EMERGENCY_DATA}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridPadding}
        columnWrapperStyle={styles.rowSpacing}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              {
                width: (screenWidth - uiSpacing.xl * 2 - 15) / 2,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => handleCall(item.num)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${item.color}15` },
              ]}
            >
              <item.icon size={28} color={item.color} />
            </View>
            <Text
              style={[styles.cardTitle, { color: theme.colors.text.primary }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[styles.cardSub, { color: theme.colors.text.secondary }]}
              numberOfLines={1}
            >
              {item.sub}
            </Text>
            <View style={[styles.badge, { backgroundColor: item.color }]}>
              <PhoneCall size={12} color="#FFF" />
              <Text style={styles.badgeText}>{item.num}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: uiSpacing.lg,
    paddingTop: Platform.OS === "ios" ? 60 : uiSpacing.xl,
    paddingBottom: uiSpacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "900" },
  headerSubtitle: { fontSize: 14, marginTop: 4, fontWeight: "500" },
  gridPadding: {
    padding: uiSpacing.lg,
    paddingBottom: 40,
  },
  rowSpacing: {
    justifyContent: "space-between",
  },
  card: {
    borderRadius: uiRadii.xl,
    padding: 18,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 1,
    ...uiShadows.soft,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", textAlign: "center" },
  cardSub: {
    fontSize: 11,
    marginBottom: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { color: "#FFF", fontWeight: "900", fontSize: 13, marginLeft: 6 },
});

export default SupportScreen;
