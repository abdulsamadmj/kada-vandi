import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const mockVendors = [
  {
    id: '1',
    name: 'Fresh Delights Food Truck',
    type: 'Food Truck',
    rating: 4.8,
    reviews: 245,
    image: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=500',
    categories: ['Burgers', 'Sandwiches', 'Drinks'],
    status: 'Open',
  },
  {
    id: '2',
    name: 'Green Grocery Van',
    type: 'Grocery',
    rating: 4.6,
    reviews: 189,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
    categories: ['Vegetables', 'Fruits', 'Organic'],
    status: 'Open',
  },
  {
    id: '3',
    name: 'Sweet Treats Ice Cream',
    type: 'Ice Cream Truck',
    rating: 4.9,
    reviews: 312,
    image: 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?w=500',
    categories: ['Ice Cream', 'Desserts', 'Beverages'],
    status: 'Closed',
  },
];

export default function VendorsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Featured Vendors</Text>
      </View>

      <ScrollView style={styles.vendorList}>
        {mockVendors.map((vendor) => (
          <Pressable
            key={vendor.id}
            style={({ pressed }) => [
              styles.vendorCard,
              pressed && styles.vendorCardPressed,
            ]}>
            <Image source={{ uri: vendor.image }} style={styles.vendorImage} />
            <View style={styles.vendorContent}>
              <View style={styles.vendorHeader}>
                <View>
                  <Text style={styles.vendorName}>{vendor.name}</Text>
                  <Text style={styles.vendorType}>{vendor.type}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: vendor.status === 'Open' ? '#34C759' : '#FF3B30' }
                ]}>
                  <Text style={styles.statusText}>{vendor.status}</Text>
                </View>
              </View>

              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.rating}>{vendor.rating}</Text>
                <Text style={styles.reviews}>({vendor.reviews} reviews)</Text>
              </View>

              <View style={styles.categoriesContainer}>
                {vendor.categories.map((category, index) => (
                  <View key={index} style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{category}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  vendorList: {
    padding: 16,
  },
  vendorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
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