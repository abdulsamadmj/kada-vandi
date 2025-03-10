import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../contexts/auth';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types/database';

export default function Inventory() {
  const { session } = useAuth();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    inventory_count: '',
    expiration_date: '',
  });

  const fetchInventory = async () => {
    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (vendorError) throw vendorError;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('name');

      if (error) throw error;
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load inventory',
        text2: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const addItem = async (item: Omit<Product, 'id' | 'vendor_id'>) => {
    try {
      setIsMutating(true);
      
      // Get vendor_id first
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (vendorError) throw vendorError;

      const { error } = await supabase
        .from('products')
        .insert([{ ...item, vendor_id: vendorData.id }]);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Item added successfully',
      });
      
      fetchInventory();
    } catch (error) {
      console.error('Error adding item:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to add item',
        text2: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const updateItem = async (id: string, updatedItem: Partial<Omit<Product, 'id' | 'vendor_id'>>) => {
    try {
      setIsMutating(true);
      const { error } = await supabase
        .from('products')
        .update(updatedItem)
        .eq('id', id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Item updated successfully',
      });
      
      fetchInventory();
    } catch (error) {
      console.error('Error updating item:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update item',
        text2: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setIsMutating(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Item deleted successfully',
      });
      
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to delete item',
        text2: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.price || !formData.inventory_count) {
      Toast.show({
        type: 'error',
        text1: 'Missing required fields',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    const itemData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      inventory_count: parseInt(formData.inventory_count),
      expiration_date: formData.expiration_date || null,
    };

    if (editingItem) {
      updateItem(editingItem.id, itemData);
    } else {
      addItem(itemData);
    }

    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      inventory_count: '',
      expiration_date: '',
    });
    setEditingItem(null);
  };

  const handleEdit = (item: Product) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      inventory_count: item.inventory_count.toString(),
      expiration_date: item.expiration_date || '',
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteItem(id) },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchInventory();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, []);

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
        <Text style={styles.itemDetails}>
          Price: ₹{item.price.toLocaleString()} | Stock: {item.inventory_count}
          {item.expiration_date && ` | Expires: ${new Date(item.expiration_date).toLocaleDateString()}`}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <Pressable onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => handleDelete(item.id)} style={[styles.actionButton, styles.deleteButton]}>
          <Text style={styles.actionButtonText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );

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
        <Text style={styles.title}>Inventory Management</Text>
        <Pressable 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>Add Item</Text>
        </Pressable>
      </View>

      <FlatList
        data={inventory}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Item Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={!isMutating}
            />

            <TextInput
              style={styles.input}
              placeholder="Description (Optional)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              editable={!isMutating}
            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
              editable={!isMutating}
            />

            <TextInput
              style={styles.input}
              placeholder="Stock Quantity"
              value={formData.inventory_count}
              onChangeText={(text) => setFormData({ ...formData, inventory_count: text })}
              keyboardType="numeric"
              editable={!isMutating}
            />

            <TextInput
              style={styles.input}
              placeholder="Expiration Date (YYYY-MM-DD)"
              value={formData.expiration_date}
              onChangeText={(text) => setFormData({ ...formData, expiration_date: text })}
              editable={!isMutating}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                disabled={isMutating}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isMutating}
              >
                {isMutating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>
                    {editingItem ? 'Update' : 'Add'}
                  </Text>
                )}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDescription: {
    color: '#666',
    marginBottom: 4,
  },
  itemDetails: {
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalButton: {
    padding: 8,
    borderRadius: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 