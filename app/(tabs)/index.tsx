import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAuth } from "../../contexts/auth";

// Only import MapView when not on web
let MapView: any;
let Marker: any;
// if (Platform.OS !== 'web') {
//   const Maps = require('react-native-maps');
//   MapView = Maps.default;
//   Marker = Maps.Marker;
// }

interface Vendor {
  id: string;
  name: string;
  type: string;
  rating: number;
  image: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

const mockVendors: Vendor[] = [
  {
    id: "1",
    name: "Fresh Delights Food Truck",
    type: "Food Truck",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=500",
    location: {
      latitude: 37.78825,
      longitude: -122.4324,
    },
  },
  {
    id: "2",
    name: "Green Grocery Van",
    type: "Grocery",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500",
    location: {
      latitude: 37.78925,
      longitude: -122.4344,
    },
  },
];

export default function HomeScreen() {
  const { session } = useAuth();
  const userData = session?.user?.user_metadata;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {userData?.name || "User"}!</Text>
      </View>

      <View style={styles.container}>
        <Text style={styles.header}>Your Dashboard</Text>
        <ScrollView style={styles.vendorList}>
          {mockVendors.map((vendor) => (
            <View key={vendor.id} style={styles.vendorCard}>
              <Image
                source={{ uri: vendor.image }}
                style={styles.vendorImage}
              />
              <View style={styles.vendorInfo}>
                <Text style={styles.vendorName}>{vendor.name}</Text>
                <Text style={styles.vendorType}>{vendor.type}</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.rating}>{vendor.rating}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
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
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
  mapContainer: {
    height: 200,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  webMapPlaceholder: {
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
  },
  webMapText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666666",
  },
  webMapSubtext: {
    fontSize: 14,
    color: "#666666",
    marginTop: 8,
  },
  map: {
    flex: 1,
  },
  vendorList: {
    padding: 16,
  },
  vendorCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  vendorImage: {
    width: 100,
    height: 100,
  },
  vendorInfo: {
    flex: 1,
    padding: 12,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  vendorType: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666666",
  },
});
