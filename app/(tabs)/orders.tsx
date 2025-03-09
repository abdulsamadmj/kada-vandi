import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const mockOrders = [
  {
    id: '1',
    vendorName: 'Fresh Delights Food Truck',
    status: 'In Progress',
    items: ['Burger Combo', 'Fries', 'Drink'],
    total: 25.99,
    eta: '15 mins',
  },
  {
    id: '2',
    vendorName: 'Green Grocery Van',
    status: 'Delivered',
    items: ['Fresh Vegetables Bundle', 'Fruits Pack'],
    total: 35.50,
    deliveredAt: '2024-02-20 14:30',
  },
];

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Orders</Text>
      </View>

      <ScrollView style={styles.orderList}>
        {mockOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.vendorName}>{order.vendorName}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: order.status === 'In Progress' ? '#007AFF' : '#34C759' }
              ]}>
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>

            <View style={styles.orderItems}>
              {order.items.map((item, index) => (
                <Text key={index} style={styles.itemText}>• {item}</Text>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.totalText}>Total: ${order.total}</Text>
              {order.eta ? (
                <View style={styles.etaContainer}>
                  <Ionicons name="time-outline" size={16} color="#666666" />
                  <Text style={styles.etaText}>ETA: {order.eta}</Text>
                </View>
              ) : (
                <Text style={styles.deliveredText}>
                  Delivered: {new Date(order.deliveredAt).toLocaleTimeString()}
                </Text>
              )}
            </View>
          </View>
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
  orderList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
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
  orderItems: {
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    marginLeft: 4,
    color: '#666666',
  },
  deliveredText: {
    color: '#666666',
  },
});