import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Dimensions,
  ScrollView,
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
  const screenWidth = Dimensions.get("window").width;
  const numColumns = 2;

  const handleCall = (number: any) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Helplines</Text>
        <Text style={styles.headerSubtitle}>
          Tap any card to call immediately
        </Text>
      </View>

      <FlatList
        data={EMERGENCY_DATA}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridPadding}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { width: (screenWidth - 50) / 2 }]}
            onPress={() => handleCall(item.num)}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${item.color}15` },
              ]}
            >
              <item.icon size={28} color={item.color} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub}>{item.sub}</Text>
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
  container: { flex: 1, backgroundColor: "#F8FAFC", marginTop: 20 },
  header: {
    padding: 25,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  headerSubtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },
  gridPadding: { padding: 15 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    margin: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  cardSub: { fontSize: 12, color: "#94A3B8", marginBottom: 10 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { color: "#FFF", fontWeight: "800", fontSize: 14, marginLeft: 5 },
});

export default SupportScreen;
