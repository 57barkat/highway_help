import React, { useState, useEffect } from "react";
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
import { useTheme } from "@/context/theme";
import { uiRadii, uiSpacing } from "@/lib/ui/system";

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
  const { theme } = useTheme();
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
      console.error("History Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(reset ? false : refreshing);
    }
  };

  useEffect(() => {
    fetchHistory(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory(true);
  };

  const renderItem = ({ item }: { item: Job }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          shadowColor: theme.isDark ? "#000" : "#64748B",
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {item.problemType}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                item.status === "completed" ? "#DCFCE7" : theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color:
                  item.status === "completed"
                    ? "#166534"
                    : theme.colors.text.secondary,
              },
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
        <Text
          style={[
            styles.starText,
            { color: theme.colors.warning || "#F59E0B" },
          ]}
        >
          ★ {item.rating > 0 ? item.rating.toFixed(1) : "No Rating"}
        </Text>
      </View>

      <Text
        style={[styles.description, { color: theme.colors.text.secondary }]}
        numberOfLines={2}
      >
        {item.description || "No description provided"}
      </Text>

      <View style={styles.detailsRow}>
        <View>
          <Text style={styles.label}>CLIENT</Text>
          <Text style={[styles.value, { color: theme.colors.text.primary }]}>
            {item.user.name}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.label}>EARNINGS</Text>
          <Text
            style={[styles.price, { color: theme.colors.success || "#10B981" }]}
          >
            Rs {item.finalPrice.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.date, { color: theme.colors.text.primary }]}>
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => fetchHistory()}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={{ marginVertical: uiSpacing.lg }}
            />
          ) : (
            <View style={{ height: 40 }} />
          )
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.colors.text.secondary }}>
                No jobs found yet.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: uiSpacing.lg,
    paddingVertical: uiSpacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "900" },
  list: { padding: uiSpacing.md },
  card: {
    padding: 20,
    borderRadius: uiRadii.xxl,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: "800" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: uiRadii.md,
  },
  badgeText: { fontSize: 11, fontWeight: "800" },
  ratingRow: { marginBottom: 12 },
  starText: { fontSize: 14, fontWeight: "700" },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: { fontSize: 15, fontWeight: "600" },
  price: { fontSize: 18, fontWeight: "900" },
  footer: {
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 12,
  },
  date: { fontSize: 12, fontWeight: "500" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
});
