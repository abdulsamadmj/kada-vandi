import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuth } from "../../contexts/auth";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import Toast from "react-native-toast-message";
import OrderCard, { Order } from "../components/OrderCard";
import { SupabaseOrder, SupabaseOrderItem } from "../types/supabase";

const ORDER_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "REJECTED",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

interface OrderItemForUpdate {
  product_id: string;
  quantity: number;
  name: string;
}

export default function OrdersScreen() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isVendor = session?.user?.user_metadata?.role === "vendor";

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from("orders")
        .select(
          `
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
            price,
            product_id,
            products (
              name
            )
          )
        `
        )
        .order("order_date", { ascending: false });

      if (isVendor && session?.user?.id) {
        const { data: vendorData } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", session.user.id)
          .single();

        if (vendorData?.id) {
          query = query.eq("vendor_id", vendorData.id);
        }
      } else if (session?.user?.id) {
        query = query.eq("customer_id", session.user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedOrders: Order[] = (data as SupabaseOrder[]).map(
        (order) => ({
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
            price: item.price,
          })),
        })
      );

      setOrders(formattedOrders);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error fetching orders",
        text2:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const updateInventoryQuantities = async (items: OrderItemForUpdate[]) => {
    try {
      // Get current inventory quantities
      const { data: products, error: fetchError } = await supabase
        .from("products")
        .select("id, inventory_count")
        .in(
          "id",
          items.map((item) => item.product_id)
        );

      if (fetchError) throw fetchError;

      // Update each product's inventory count
      for (const item of items) {
        const product = products?.find((p) => p.id === item.product_id);
        if (!product) continue;

        const newCount = product.inventory_count - item.quantity;
        if (newCount < 0) {
          throw new Error(`Insufficient inventory for ${item.name}`);
        }

        const { error: updateError } = await supabase
          .from("products")
          .update({ inventory_count: newCount })
          .eq("id", item.product_id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      throw error;
    }
  };

  const handleOrderAction = async (
    orderId: string,
    action: "ACCEPTED" | "REJECTED"
  ) => {
    try {
      if (action === "ACCEPTED") {
        // Get order items first
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select(
            `
            order_items (
              quantity,
              product_id,
              products (
                name
              )
            )
          `
          )
          .eq("id", orderId)
          .single();

        if (orderError) throw orderError;

        // Format items for inventory update
        const items: OrderItemForUpdate[] = (
          orderData.order_items as SupabaseOrderItem[]
        ).map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          name: item.products.name,
        }));

        // Update inventory quantities
        await updateInventoryQuantities(items);
      }

      // Update order status
      const { error } = await supabase
        .from("orders")
        .update({ status: action })
        .eq("id", orderId);

      if (error) throw error;

      Toast.show({
        type: "success",
        text1: `Order ${action.toLowerCase()}`,
      });

      fetchOrders();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: `Failed to ${action.toLowerCase()} order`,
        text2:
          error instanceof Error ? error.message : "Please try again later",
      });
    }
  };

  const confirmReject = (orderId: string) => {
    Alert.alert(
      "Reject Order",
      "Are you sure you want to reject this order?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          onPress: () => handleOrderAction(orderId, "REJECTED"),
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      Toast.show({
        type: "success",
        text1: "Order status updated",
      });

      fetchOrders();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to update status",
        text2:
          error instanceof Error ? error.message : "Please try again later",
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
      .channel("orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
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
          {isVendor ? "Manage Orders" : "Your Orders"}
        </Text>
      </View>

      <ScrollView
        style={styles.orderList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isVendor={isVendor}
            onAccept={(orderId: string) =>
              handleOrderAction(orderId, "ACCEPTED")
            }
            onReject={(orderId: string) => confirmReject(orderId)}
            onUpdateStatus={handleUpdateStatus}
          />
        ))}

        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isVendor ? "No orders to manage" : "No orders yet"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
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
  },
  orderList: {
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
  },
});
