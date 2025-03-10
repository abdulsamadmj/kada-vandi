import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeliveryAddress, DeliveryAddress } from '../../../contexts/delivery-address';
import { Stack } from 'expo-router';

interface AddressFormData {
  label: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export default function AddressesScreen() {
  const {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useDeliveryAddress();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    label: '',
    address: '',
  });

  const handleAddPress = () => {
    setEditingAddress(null);
    setFormData({ label: '', address: '' });
    setIsModalVisible(true);
  };

  const handleEditPress = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
      location: address.location,
    });
    setIsModalVisible(true);
  };

  const handleDeletePress = (address: DeliveryAddress) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => deleteAddress(address.id),
          style: 'destructive',
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!formData.label || !formData.address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (editingAddress) {
        await updateAddress({
          ...editingAddress,
          ...formData,
        });
      } else {
        await addAddress({
          ...formData,
          isDefault: addresses.length === 0,
        });
      }
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save address');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Delivery Addresses',
        }}
      />

      <ScrollView style={styles.addressList}>
        {addresses.map((address) => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>{address.label}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => handleEditPress(address)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                >
                  <Ionicons name="pencil" size={18} color="#007AFF" />
                </Pressable>
                <Pressable
                  onPress={() => handleDeletePress(address)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                >
                  <Ionicons name="trash" size={18} color="#FF3B30" />
                </Pressable>
              </View>
            </View>

            <Text style={styles.address}>{address.address}</Text>

            {!address.isDefault && (
              <Pressable
                onPress={() => setDefaultAddress(address.id)}
                style={({ pressed }) => [
                  styles.setDefaultButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.setDefaultText}>Set as Default</Text>
              </Pressable>
            )}
          </View>
        ))}

        {addresses.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#666666" />
            <Text style={styles.emptyText}>No addresses saved yet</Text>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={handleAddPress}
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add New Address</Text>
      </Pressable>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </Text>
              <Pressable
                onPress={() => setIsModalVisible(false)}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </Pressable>
            </View>

            <View style={styles.form}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Label</Text>
                <TextInput
                  style={styles.input}
                  value={formData.label}
                  onChangeText={(text) => setFormData({ ...formData, label: text })}
                  placeholder="e.g., Home, Work, etc."
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput
                  style={[styles.input, styles.addressInput]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter full address"
                  multiline
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.submitButtonText}>Save Address</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addressList: {
    flex: 1,
    padding: 16,
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  setDefaultButton: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  setDefaultText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonPressed: {
    opacity: 0.7,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  form: {
    gap: 16,
  },
  formField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addressInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 