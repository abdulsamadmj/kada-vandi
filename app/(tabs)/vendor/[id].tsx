import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import React from "react";
import { Product, Vendor } from "@/types/database";
import { useCart } from "@/contexts/cart";
import { supabase } from "@/lib/supabase";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=500";

export default function VendorDetails() {
  const { id } = useLocalSearchParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    state: cartState,
    addItem,
    updateQuantity,
    setCartVendor,
  } = useCart();

  const fetchVendorDetails = async () => {
    try {
      // Get vendor details with current status and ratings
      const { data: vendorData, error: vendorError } = await supabase.rpc(
        "get_all_vendors"
      );

      if (vendorError) throw vendorError;
      const currentVendor = vendorData.find((v: Vendor) => v.id === id);
      if (!currentVendor) throw new Error("Vendor not found");
      setVendor(currentVendor);

      // Get vendor's products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", id)
        .order("name");

      if (productsError) throw productsError;
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching vendor details:", error);
      Toast.show({
        type: "error",
        text1: "Error loading vendor details",
        text2:
          error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchVendorDetails();
  }, []);

  useEffect(() => {
    fetchVendorDetails();
  }, [id]);

  // Subscribe to product updates
  useEffect(() => {
    const channel = supabase
      .channel("product_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `vendor_id=eq.${id}`,
        },
        () => {
          fetchVendorDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleAddToCart = (product: Product) => {
    try {
      if (cartState.vendorId && cartState.vendorId !== product.vendor_id) {
        Toast.show({
          type: "error",
          text1: "Items from different vendors",
          text2: "Please complete or clear your current cart first",
        });
        return;
      }

      if (!vendor?.is_active) {
        Toast.show({
          type: "error",
          text1: "Vendor is currently closed",
          text2: "Please try again when the vendor is open",
        });
        return;
      }

      const currentQuantity = cartState.items[product.id]?.quantity || 0;
      if (currentQuantity >= product.inventory_count) {
        Toast.show({
          type: "error",
          text1: "Maximum quantity reached",
          text2: "No more items available in stock",
        });
        return;
      }

      setCartVendor(product.vendor_id);
      addItem(product, 1);
      Toast.show({
        type: "success",
        text1: "Added to cart",
        text2: product.name,
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error adding to cart",
        text2: error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  if (isLoading || !vendor) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: vendor.business_name,
          headerBackTitle: "Back",
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Image source={{ uri: FALLBACK_IMAGE }} style={styles.coverImage} />
          <View style={styles.vendorInfo}>
            <View style={styles.vendorHeader}>
              <View>
                <Text style={styles.vendorName}>{vendor.business_name}</Text>
                <Text style={styles.vendorContact}>{vendor.contact}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: vendor.is_active ? "#34C759" : "#FF3B30",
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {vendor.is_active ? "Open" : "Closed"}
                </Text>
              </View>
            </View>

            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{vendor.avg_rating.toFixed(1)}</Text>
              <Text style={styles.reviews}>
                ({vendor.review_count} reviews)
              </Text>
              {vendor.is_active && vendor.distance_meters > 0 && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Ionicons name="location" size={16} color="#007AFF" />
                  <Text style={styles.distance}>
                    {(vendor.distance_meters / 1000).toFixed(1)} km
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {products.length === 0 ? (
            <Text style={styles.noProductsText}>
              No products available at the moment.
            </Text>
          ) : (
            products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  {product.description && (
                    <Text style={styles.productDescription}>
                      {product.description}
                    </Text>
                  )}
                  <Text style={styles.productPrice}>
                    ₹{product.price.toLocaleString()}
                  </Text>
                  {product.inventory_count === 0 && (
                    <Text style={styles.outOfStock}>Out of Stock</Text>
                  )}
                </View>
                {product.inventory_count > 0 && (
                  <View style={styles.productActions}>
                    {cartState.items[product.id] ? (
                      <View style={styles.quantityContainer}>
                        <Pressable
                          onPress={() =>
                            updateQuantity(
                              product.id,
                              cartState.items[product.id].quantity - 1
                            )
                          }
                          style={styles.quantityButton}
                        >
                          <Ionicons name="remove" size={20} color="#007AFF" />
                        </Pressable>
                        <Text style={styles.quantity}>
                          {cartState.items[product.id].quantity}
                        </Text>
                        <Pressable
                          onPress={() => handleAddToCart(product)}
                          style={styles.quantityButton}
                          disabled={
                            cartState.items[product.id].quantity >=
                            product.inventory_count
                          }
                        >
                          <Ionicons
                            name="add"
                            size={20}
                            color={
                              cartState.items[product.id].quantity >=
                              product.inventory_count
                                ? "#999"
                                : "#007AFF"
                            }
                          />
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.addButton}
                        onPress={() => handleAddToCart(product)}
                      >
                        <Text style={styles.addButtonText}>Add</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </>
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
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  coverImage: {
    width: "100%",
    height: 200,
  },
  vendorInfo: {
    padding: 16,
  },
  vendorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  vendorContact: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "bold",
  },
  reviews: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  separator: {
    marginHorizontal: 8,
    color: "#666",
  },
  distance: {
    marginLeft: 4,
    fontSize: 14,
    color: "#007AFF",
  },
  productsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  noProductsText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  outOfStock: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  productActions: {
    minWidth: 80,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    padding: 4,
  },
  quantity: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
  },
});
