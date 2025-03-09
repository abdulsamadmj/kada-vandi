import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vendor } from '../types/database';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=500';

interface VendorCardProps {
  vendor: Vendor;
  showDistance?: boolean;
  onPress?: () => void;
}

export function VendorCard({ vendor, showDistance = false, onPress }: VendorCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.vendorCard,
        pressed && styles.vendorCardPressed,
      ]}
      onPress={onPress}
    >
      <Image 
        source={{ uri: FALLBACK_IMAGE }} 
        style={styles.vendorImage}
      />
      <View style={styles.vendorContent}>
        <View style={styles.vendorHeader}>
          <View>
            <Text style={styles.vendorName}>{vendor.business_name}</Text>
            <Text style={styles.vendorType}>{vendor.contact}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: vendor.is_active ? '#34C759' : '#FF3B30' }
          ]}>
            <Text style={styles.statusText}>
              {vendor.is_active ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{vendor.avg_rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({vendor.review_count} reviews)</Text>
          {showDistance && (
            <>
              <Text style={styles.separator}>•</Text>
              <Ionicons name="location" size={16} color="#007AFF" />
              <Text style={styles.distance}>
                {(vendor.distance_meters / 1000).toFixed(1)} km
              </Text>
            </>
          )}
        </View>

        {vendor.recent_products.length > 0 && (
          <View style={styles.categoriesContainer}>
            {vendor.recent_products.map((product, index) => (
              <View key={index} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {product.name} - ₦{product.price.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  vendorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vendorCardPressed: {
    opacity: 0.7,
  },
  vendorImage: {
    width: '100%',
    height: 200,
  },
  vendorContent: {
    padding: 16,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vendorType: {
    fontSize: 14,
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviews: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666666',
  },
  separator: {
    marginHorizontal: 8,
    color: '#666666',
  },
  distance: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666666',
  },
}); 