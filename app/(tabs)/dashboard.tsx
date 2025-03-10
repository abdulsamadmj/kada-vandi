import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, RefreshControl } from 'react-native';
import { useAuth } from '../../contexts/auth';
import { Ionicons } from '@expo/vector-icons';
import { VendorLocationTracker } from '../../components/VendorLocationTracker';
import { supabase } from '../../lib/supabase';
import Toast from 'react-native-toast-message';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  order_date: string;
  vendor_name?: string;
  customer_name?: string;
  items: {
    name: string;
    quantity: number;
  }[];
}

interface SupabaseOrder {
  id: string;
  status: string;
  total_amount: number;
  order_date: string;
  vendors: {
    business_name: string;
  } | null;
  users: {
    name: string;
  } | null;
  order_items: Array<{
    quantity: number;
    products: {
      name: string;
    };
  }>;
}

type SupabaseQueryResult = {
  id: string;
  status: string;
  total_amount: number;
  order_date: string;
  vendors: {
    business_name: string;
  } | null;
  users: {
    name: string;
  } | null;
  order_items: Array<{
    quantity: number;
    products: {
      name: string;
    };
  }>;
}

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

export default function DashboardScreen() {
  const { session } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const userData = session?.user?.user_metadata;
  const isVendor = userData?.role === 'vendor';

  const fetchRecentOrders = async () => {
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

      const formattedOrders: Order[] = (data as unknown as SupabaseQueryResult[]).map(order => ({
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        order_date: order.order_date,
        vendor_name: order.vendors?.business_name,
        customer_name: order.users?.name,
        items: order.order_items.map(item => ({
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
                    <Text key={index} style={styles.itemText}>
                      • {item.quantity}x {item.name}
                    </Text>
                  ))}
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.totalText}>
                    Total: ₦{order.total_amount?.toLocaleString()}
                  </Text>
                  <Text style={styles.dateText}>
                    {new Date(order.order_date).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!isVendor && (
          <>
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
          </>
        )}
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
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
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 16,
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
    color: '#666',
    marginBottom: 4,
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
    color: '#666',
    fontSize: 12,
  },
});
