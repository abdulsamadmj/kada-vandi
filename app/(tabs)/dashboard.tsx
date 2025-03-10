import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, RefreshControl, Pressable } from 'react-native';
import { useAuth } from '../../contexts/auth';
import { Ionicons } from '@expo/vector-icons';
import { VendorLocationTracker } from '../../components/VendorLocationTracker';
import { supabase } from '../../lib/supabase';
import Toast from 'react-native-toast-message';
import OrderCard, { Order, getStatusColor } from '../components/OrderCard';
import { SupabaseOrder, SupabaseOrderItem } from '../types/supabase';

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

interface OrderItemForUpdate {
  product_id: string;
  quantity: number;
  name: string;
}

// Mock data for vendors - replace with real data later
const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Kada Vandi 1',
    type: 'Street Food',
    rating: 4.5,
    image: 'https://picsum.photos/200',
    location: {
      latitude: 0,
      longitude: 0,
    },
  },
  {
    id: '2',
    name: 'Kada Vandi 2',
    type: 'Snacks',
    rating: 4.2,
    image: 'https://picsum.photos/200',
    location: {
      latitude: 0,
      longitude: 0,
    },
  },
];

export default function DashboardScreen() {
  const { session } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const userData = session?.user?.user_metadata;
  const isVendor = userData?.role === 'vendor';

  const updateInventoryQuantities = async (items: OrderItemForUpdate[]) => {
    try {
      // Get current inventory quantities
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, inventory_count')
        .in('id', items.map(item => item.product_id));

      if (fetchError) throw fetchError;

      // Update each product's inventory count
      for (const item of items) {
        const product = products?.find(p => p.id === item.product_id);
        if (!product) continue;

        const newCount = product.inventory_count - item.quantity;
        if (newCount < 0) {
          throw new Error(`Insufficient inventory for ${item.name}`);
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({ inventory_count: newCount })
          .eq('id', item.product_id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      throw error;
    }
  };

  const handleOrderAction = async (orderId: string, action: 'ACCEPTED' | 'REJECTED') => {
    try {
      if (action === 'ACCEPTED') {
        // Get order items first
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            order_items (
              quantity,
              product_id,
              products (
                name
              )
            )
          `)
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        // Format items for inventory update
        const items: OrderItemForUpdate[] = (orderData.order_items as SupabaseOrderItem[]).map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          name: item.products.name,
        }));

        // Update inventory quantities
        await updateInventoryQuantities(items);
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: action })
        .eq('id', orderId);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: `Order ${action.toLowerCase()}`,
      });

      fetchRecentOrders();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: `Failed to ${action.toLowerCase()} order`,
        text2: error instanceof Error ? error.message : 'Please try again later',
      });
    }
  };

  const fetchRecentOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          order_date,
          delivery_address,
          vendors (
            business_name
          ),
          users (
            name
          ),
          order_items (
            quantity,
            products (
              name
            )
          )
        `)
        .order('order_date', { ascending: false })
        .limit(2);

      if (isVendor && session?.user?.id) {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (vendorData?.id) {
          query = query.eq('vendor_id', vendorData.id);
        }
      } else if (session?.user?.id) {
        query = query.eq('customer_id', session.user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data) {
        setRecentOrders([]);
        return;
      }

      const formattedOrders: Order[] = (data as SupabaseOrder[]).map(order => ({
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        order_date: order.order_date,
        vendor_name: order.vendors?.business_name,
        customer_name: order.users?.name,
        delivery_address: order.delivery_address,
        items: order.order_items.map((item: SupabaseOrderItem) => ({
          name: item.products.name,
          quantity: item.quantity,
        })),
      }));

      setRecentOrders(formattedOrders);
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

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchRecentOrders();
  }, []);

  useEffect(() => {
    fetchRecentOrders();

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
          fetchRecentOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {userData?.name || 'User'}!</Text>
      </View>

      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {isVendor && <VendorLocationTracker />}

        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {recentOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isVendor={isVendor}
                onAccept={(orderId: string) => handleOrderAction(orderId, 'ACCEPTED')}
                onReject={(orderId: string) => handleOrderAction(orderId, 'REJECTED')}
              />
            ))}
          </View>
        )}

        {!isVendor && (
          <>
            <Text style={styles.sectionTitle}>Nearby Vendors</Text>
            <ScrollView style={styles.vendorList}>
              {mockVendors.map((vendor: Vendor) => (
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
          </>
        )}
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
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
