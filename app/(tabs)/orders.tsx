import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import Toast from 'react-native-toast-message';

const ORDER_STATUSES = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

type OrderStatus = typeof ORDER_STATUSES[number];

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: OrderStatus;
  total_amount: number;
  order_date: string;
  vendor_name?: string;
  customer_name?: string;
  items: OrderItem[];
}

export default function OrdersScreen() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isVendor = session?.user?.user_metadata?.role === 'vendor';

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          order_date,
          vendors (
            business_name
          ),
          users (
            name
          ),
          order_items (
            quantity,
            price,
            products (
              name
            )
          )
        `)
        .order('order_date', { ascending: false });

      if (isVendor) {
        // Get vendor ID first
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', session?.user.id)
          .single();

        if (vendorError) throw vendorError;
        
        query = query.eq('vendor_id', vendorData.id);
      } else {
        query = query.eq('customer_id', session?.user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedOrders: Order[] = data.map(order => ({
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        order_date: order.order_date,
        vendor_name: order.vendors?.business_name,
        customer_name: order.users?.name,
        items: order.order_items.map(item => ({
          name: item.products.name,
          quantity: item.quantity,
          price: item.price,
        })),
      }));

      setOrders(formattedOrders);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error fetching orders',
        text2: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Order status updated',
      });

      fetchOrders();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update status',
        text2: error instanceof Error ? error.message : 'Please try again later',
      });
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchOrders();

    // Subscribe to order updates
    const channel = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isVendor ? 'Manage Orders' : 'Your Orders'}
        </Text>
      </View>

      <ScrollView 
        style={styles.orderList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderTitle}>
                {isVendor ? order.customer_name : order.vendor_name}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) }
              ]}>
                <Text style={styles.statusText}>{order.status}</Text>
              </View>
            </View>

            <View style={styles.orderItems}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <Text style={styles.itemText}>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ₦{(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.totalText}>
                Total: ₦{order.total_amount}
              </Text>
              <Text style={styles.dateText}>
                {new Date(order.order_date).toLocaleDateString()}
              </Text>
            </View>

            {isVendor && order.status !== 'DELIVERED' && (
              <View style={styles.actions}>
                {ORDER_STATUSES.map((status, index) => {
                  const currentIndex = ORDER_STATUSES.indexOf(order.status);
                  const isNextStatus = index === currentIndex + 1;

                  if (!isNextStatus) return null;

                  return (
                    <Pressable
                      key={status}
                      onPress={() => handleUpdateStatus(order.id, status)}
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.actionButtonPressed,
                      ]}
                    >
                      <Text style={styles.actionButtonText}>
                        Mark as {status}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ))}

        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#666666" />
            <Text style={styles.emptyText}>
              {isVendor ? 'No orders to manage' : 'No orders yet'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'PLACED':
      return '#FF9500';
    case 'ACCEPTED':
      return '#007AFF';
    case 'PREPARING':
      return '#5856D6';
    case 'OUT_FOR_DELIVERY':
      return '#FF2D55';
    case 'DELIVERED':
      return '#34C759';
    default:
      return '#666666';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  orderTitle: {
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
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#666666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#666666',
    fontSize: 12,
  },
  actions: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});