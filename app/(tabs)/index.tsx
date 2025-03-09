import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../contexts/auth";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";

interface Vendor {
  id: string;
  business_name: string;
  contact: string;
}

export default function HomeScreen() {
  const { session } = useAuth();
  const userData = session?.user?.user_metadata;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase.rpc("get_active_vendors");

      if (error) {
        console.error("Error fetching vendors:", error);
        setErrorMsg("Error fetching vendors");
        return;
      }

      setVendors(data || []);
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg("Error fetching vendors");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVendors();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchVendors();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("vendors")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vendors",
        },
        () => {
          // Refresh the vendors list when changes occur
          fetchVendors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (errorMsg) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        <Text style={styles.errorText}>{errorMsg}</Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {userData?.name || "User"}!</Text>
      </View>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        <Text style={styles.sectionTitle}>
          Active Vendors ({vendors.length})
        </Text>
        <ScrollView style={styles.vendorList}>
          {isLoading ? (
            <View style={styles.container}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : vendors.length === 0 ? (
            <Text style={styles.noVendorsText}>No active vendors found</Text>
          ) : (
            vendors.map((vendor) => (
              <View key={vendor.id} style={styles.vendorCard}>
                <View style={styles.vendorInfo}>
                  <Text style={styles.vendorName}>{vendor.business_name}</Text>
                  <Text style={styles.vendorType}>{vendor.contact}</Text>
                  <View style={styles.distanceContainer}>
                    <Ionicons name="business" size={16} color="#007AFF" />
                    <Text style={styles.distance}>Active Vendor</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    margin: 16,
  },
  vendorList: {
    flex: 1,
  },
  vendorCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorInfo: {
    padding: 16,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  vendorType: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  distance: {
    marginLeft: 4,
    fontSize: 14,
    color: "#007AFF",
  },
  errorText: {
    textAlign: "center",
    color: "#FF3B30",
    margin: 16,
  },
  noVendorsText: {
    textAlign: "center",
    color: "#666",
    margin: 16,
    fontSize: 16,
  },
});
