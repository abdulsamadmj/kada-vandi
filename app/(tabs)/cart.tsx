import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/cart';
import { useAuth } from '../../contexts/auth';
import { useDeliveryAddress } from '../../contexts/delivery-address';
import { useState, useCallback } from 'react';
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
  const { state: cartState, removeItem, updateQuantity, clearCart, getTotalAmount } = useCart();
  const { addresses, selectedAddress, selectAddress } = useDeliveryAddress();
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAddressSelect, setShowAddressSelect] = useState(false);
  const router = useRouter();

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Toast.show({
        type: 'error',
        text1: 'Please select a delivery address',
        text2: 'Add an address from your profile or select an existing one',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Create the order with delivery address
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: session?.user.id,
          vendor_id: cartState.vendorId,
          status: 'PLACED',
          total_amount: getTotalAmount(),
          delivery_address: {
            label: selectedAddress.label,
            address: selectedAddress.address,
            location: selectedAddress.location,
          },
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = Object.values(cartState.items).map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear the cart
      clearCart();

      Toast.show({
        type: 'success',
        text1: 'Order placed successfully',
      });

      // Navigate to orders page
      router.push('/(tabs)/orders');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to place order',
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

  const handleAddressPress = () => {
    if (addresses.length === 0) {
      router.push('/profile/addresses');
    } else {
      setShowAddressSelect(true);
    }
  };

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

      <ScrollView style={styles.content}>
        <Pressable
          onPress={handleAddressPress}
          style={({ pressed }) => [
            styles.addressSection,
            pressed && styles.addressSectionPressed,
          ]}
        >
          <View style={styles.addressHeader}>
            <Ionicons name="location-outline" size={24} color="#666666" />
            <Text style={styles.addressTitle}>Delivery Address</Text>
          </View>
          
          {selectedAddress ? (
            <View style={styles.selectedAddress}>
              <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
            </View>
          ) : (
            <Text style={styles.addAddressText}>
              {addresses.length > 0 ? 'Select a delivery address' : 'Add a delivery address'}
            </Text>
          )}
          
          <Ionicons name="chevron-forward" size={24} color="#666666" />
        </Pressable>

        {Object.values(cartState.items).map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price.toLocaleString()}</Text>
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
          <Text style={styles.totalAmount}>₹{getTotalAmount().toLocaleString()}</Text>
        </View>

        <Pressable
          onPress={() => setShowConfirm(true)}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.placeOrderButton,
            pressed && styles.placeOrderButtonPressed,
            isLoading && styles.placeOrderButtonDisabled,
            !selectedAddress && styles.placeOrderButtonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              {selectedAddress ? 'Place Order (Cash on Delivery)' : 'Select Delivery Address'}
            </Text>
          )}
        </Pressable>
      </View>

      <AlertDialog
        isVisible={showConfirm}
        title="Confirm Order"
        message={`Are you sure you want to place this order?\n\nDelivery to: ${selectedAddress?.label}\n${selectedAddress?.address}\n\nTotal Amount: ₹${getTotalAmount().toLocaleString()}\nPayment Method: Cash on Delivery`}
        confirmText="Place Order"
        onConfirm={() => {
          setShowConfirm(false);
          handlePlaceOrder();
        }}
        onCancel={() => setShowConfirm(false)}
      />

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

      <AlertDialog
        isVisible={showAddressSelect}
        title="Select Delivery Address"
        message={addresses.map(addr => 
          `${addr.label}${addr.isDefault ? ' (Default)' : ''}\n${addr.address}`
        ).join('\n\n')}
        confirmText="Add New Address"
        onConfirm={() => {
          setShowAddressSelect(false);
          router.push('/profile/addresses');
        }}
        cancelText="Close"
        onCancel={() => setShowAddressSelect(false)}
        options={addresses.map(addr => ({
          text: addr.label,
          onPress: () => {
            selectAddress(addr);
            setShowAddressSelect(false);
          }
        }))}
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
  addressSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressSectionPressed: {
    opacity: 0.7,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  selectedAddress: {
    flex: 1,
    marginHorizontal: 16,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666666',
  },
  addAddressText: {
    flex: 1,
    marginHorizontal: 16,
    fontSize: 16,
    color: '#007AFF',
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
  placeOrderButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeOrderButtonPressed: {
    opacity: 0.7,
  },
  placeOrderButtonDisabled: {
    opacity: 0.5,
  },
  placeOrderButtonText: {
    color: '#fff',
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