import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface OrderItem {
  name: string;
  quantity: number;
  price?: number;
}

export interface Order {
  id: string;
  status: string;
  total_amount: number;
  order_date: string;
  vendor_name?: string;
  customer_name?: string;
  delivery_address?: {
    label: string;
    address: string;
  };
  items: OrderItem[];
}

interface OrderCardProps {
  order: Order;
  isVendor: boolean;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
}

const ORDER_STATUSES = [
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'REJECTED',
] as const;

export function getStatusColor(status: string): string {
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
    case 'REJECTED':
      return '#FF3B30';
    default:
      return '#666666';
  }
}

export default function OrderCard({ order, isVendor, onAccept, onReject, onUpdateStatus }: OrderCardProps) {
  return (
    <View style={styles.orderCard}>
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

      {order.delivery_address && (
        <View style={styles.deliveryAddress}>
          <Text style={styles.addressLabel}>{order.delivery_address.label}</Text>
          <Text style={styles.addressText}>{order.delivery_address.address}</Text>
        </View>
      )}

      <View style={styles.orderItems}>
        {order.items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemText}>
              • {item.quantity}x {item.name}
            </Text>
            {item.price && (
              <Text style={styles.itemPrice}>
                ₹{(item.price * item.quantity)}
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalText}>
          Total: ₹{order.total_amount?.toLocaleString()}
        </Text>
        <Text style={styles.dateText}>
          {new Date(order.order_date).toLocaleString()}
        </Text>
      </View>

      {isVendor && (
        <View style={styles.actions}>
          {order.status === 'PLACED' ? (
            <View style={styles.actionButtons}>
              <Pressable
                onPress={() => onAccept?.(order.id)}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.acceptButton,
                  pressed && styles.actionButtonPressed,
                ]}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </Pressable>
              <Pressable
                onPress={() => onReject?.(order.id)}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.rejectButton,
                  pressed && styles.actionButtonPressed,
                ]}
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </Pressable>
            </View>
          ) : (
            order.status !== 'DELIVERED' && order.status !== 'REJECTED' && (
              <>
                {ORDER_STATUSES.map((status, index) => {
                  const currentIndex = ORDER_STATUSES.indexOf(order.status as typeof ORDER_STATUSES[number]);
                  const isNextStatus = index === currentIndex + 1;

                  if (!isNextStatus) return null;

                  return (
                    <Pressable
                      key={status}
                      onPress={() => onUpdateStatus?.(order.id, status)}
                      style={({ pressed }) => [
                        styles.actionButton,
                        { backgroundColor: getStatusColor(status) },
                        pressed && styles.actionButtonPressed,
                      ]}
                    >
                      <Text style={styles.actionButtonText}>
                        Mark as {status}
                      </Text>
                    </Pressable>
                  );
                })}
              </>
            )
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  deliveryAddress: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
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
    color: '#666',
    fontSize: 12,
  },
  actions: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});