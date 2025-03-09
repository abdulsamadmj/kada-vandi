import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useAuth } from '../../contexts/auth';
import { Ionicons } from '@expo/vector-icons';
import { VendorLocationTracker } from '../../components/VendorLocationTracker';
import { supabase } from '../../lib/supabase';

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
  const isVendor = userData?.role === 'vendor';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {userData?.name || "User"}!</Text>
      </View>

      {isVendor ? (
        <ScrollView style={styles.container}>
          <VendorLocationTracker />
          {/* Add vendor-specific dashboard content here */}
        </ScrollView>
      ) : (
        <ScrollView style={styles.container}>
          <Text style={styles.sectionTitle}>Nearby Vendors</Text>
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
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 16,
  },
  vendorList: {
    flex: 1,
  },
  vendorCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vendorType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
});
