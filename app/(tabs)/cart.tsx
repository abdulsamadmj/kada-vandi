import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/cart';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { AlertDialog } from '../../components/AlertDialog';

interface VendorInfo {
  id: string;
  name: string;
  is_active: boolean;
}

export default function CartScreen() {
  const { 
    state: cartState, 
    removeItem, 
    updateQuantity, 
    clearCart,
    getTotalAmount 
  } = useCart();
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (cartState.vendorId) {
      fetchVendorInfo();
    } else {
      setIsLoading(false);
    }
  }, [cartState.vendorId]);

  const fetchVendorInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, is_active')
        .eq('id', cartState.vendorId)
        .single();

      if (error) throw error;
      setVendor(data);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error fetching vendor info',
        text2: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, change: number) => {
    const item = cartState.items[productId];
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= item.inventory_count) {
      updateQuantity(productId, newQuantity);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Stock limit reached',
        text2: `Only ${item.inventory_count} items available`,
      });
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    Toast.show({
      type: 'success',
      text1: 'Item removed from cart',
    });
  };

  const handleClearCart = () => {
    clearCart();
    Toast.show({
      type: 'success',
      text1: 'Cart cleared',
    });
  };

  const handleCheckout = () => {
    if (!vendor?.is_active) {
      Toast.show({
        type: 'error',
        text1: 'Vendor is currently closed',
        text2: 'Please try again later',
      });
      return;
    }
    // Navigate to checkout
    router.push('/checkout');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (Object.keys(cartState.items).length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="cart-outline" size={64} color="#666666" />
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Pressable
          style={styles.browseButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.browseButtonText}>Browse Products</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cart</Text>
        <Pressable
          onPress={() => setShowClearConfirm(true)}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.clearButtonPressed,
          ]}
        >
          <Text style={styles.clearButtonText}>Clear Cart</Text>
        </Pressable>
      </View>

      {vendor && (
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <View style={[
            styles.vendorStatus,
            { backgroundColor: vendor.is_active ? '#4CAF50' : '#FF3B30' }
          ]}>
            <Text style={styles.vendorStatusText}>
              {vendor.is_active ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.content}>
        {Object.values(cartState.items).map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
            </View>

            <View style={styles.itemActions}>
              <Pressable
                onPress={() => handleQuantityChange(item.id, -1)}
                style={styles.quantityButton}
              >
                <Ionicons name="remove" size={20} color="#666666" />
              </Pressable>

              <Text style={styles.quantity}>{item.quantity}</Text>

              <Pressable
                onPress={() => handleQuantityChange(item.id, 1)}
                style={styles.quantityButton}
              >
                <Ionicons name="add" size={20} color="#666666" />
              </Pressable>

              <Pressable
                onPress={() => handleRemoveItem(item.id)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₦{getTotalAmount().toLocaleString()}</Text>
        </View>

        <Pressable
          onPress={handleCheckout}
          style={({ pressed }) => [
            styles.checkoutButton,
            pressed && styles.checkoutButtonPressed,
          ]}
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </Pressable>
      </View>

      <AlertDialog
        isVisible={showClearConfirm}
        title="Clear Cart"
        message="Are you sure you want to clear your cart?"
        confirmText="Clear"
        onConfirm={() => {
          setShowClearConfirm(false);
          handleClearCart();
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </View>
  );
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonPressed: {
    opacity: 0.7,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  vendorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vendorStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vendorStatusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  cartItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 1,
  },
  itemInfo: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemPrice: {
    color: '#666666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  quantity: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 8,
    marginLeft: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666666',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonPressed: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 