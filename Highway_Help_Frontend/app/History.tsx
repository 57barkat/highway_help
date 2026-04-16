import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native";
import api from "./../api/api";

interface Job {
  id: number;
  problemType: string;
  description: string;
  status: string;
  finalPrice: number;
  rating: number;
  createdAt: string;
  user: { name: string };
}

export default function History() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    const nextPage = reset ? 1 : page;
    try {
      const response = await api.get(
        `/request/history?page=${nextPage}&limit=10`,
      );
      const data = response.data;
      setJobs(reset ? data.jobs : (prev) => [...prev, ...data.jobs]);
      setHasMore(data.page < data.totalPages);
      setPage(reset ? 2 : nextPage + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory(true);
  }, []);

  const renderItem = ({ item }: { item: Job }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.problemType}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
        <Text style={styles.starText}>⭐ {item.rating.toFixed(1)}</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description || "No description provided"}
      </Text>

      <View style={styles.detailsRow}>
        <View>
          <Text style={styles.label}>CLIENT</Text>
          <Text style={styles.value}>{item.user.name}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.label}>EARNINGS</Text>
          <Text style={styles.price}>
            Rs {item.finalPrice.toLocaleString()}
          </Text>
        </View>
      </View>

      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Job History</Text>
      </View>
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => fetchHistory()}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHistory(true)}
            tintColor="#00A99D"
          />
        }
        ListFooterComponent={
          loading ? <ActivityIndicator size="small" color="#00A99D" /> : null
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  topBar: {
    padding: 24,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1E293B" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  badge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#166534" },
  ratingRow: { marginBottom: 12 },
  starText: { fontSize: 14, fontWeight: "800", color: "#F59E0B" },
  description: { fontSize: 14, color: "#64748B", marginBottom: 16 },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  value: { fontSize: 14, fontWeight: "600", color: "#334155", marginTop: 2 },
  price: { fontSize: 16, fontWeight: "800", color: "#00A99D", marginTop: 2 },
  date: {
    fontSize: 12,
    color: "#CBD5E1",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
});
