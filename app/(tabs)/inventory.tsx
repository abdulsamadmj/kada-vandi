import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useAuth } from '../../contexts/auth';
import Toast from 'react-native-toast-message';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
}

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
  });

  // Simulated API calls (replace with actual API calls later)
  const fetchInventory = async () => {
    // TODO: Replace with actual API call
    // For now, using mock data
    const mockData: InventoryItem[] = [
      {
        id: '1',
        name: 'Sample Item',
        description: 'This is a sample item',
        price: 9.99,
        quantity: 10,
        category: 'General',
      },
    ];
    setInventory(mockData);
  };

  const addItem = async (item: Omit<InventoryItem, 'id'>) => {
    // TODO: Replace with actual API call
    const newItem = {
      ...item,
      id: Date.now().toString(),
    };
    setInventory([...inventory, newItem]);
    Toast.show({
      type: 'success',
      text1: 'Item added successfully',
    });
  };

  const updateItem = async (id: string, updatedItem: Omit<InventoryItem, 'id'>) => {
    // TODO: Replace with actual API call
    setInventory(inventory.map(item => 
      item.id === id ? { ...updatedItem, id } : item
    ));
    Toast.show({
      type: 'success',
      text1: 'Item updated successfully',
    });
  };

  const deleteItem = async (id: string) => {
    // TODO: Replace with actual API call
    setInventory(inventory.filter(item => item.id !== id));
    Toast.show({
      type: 'success',
      text1: 'Item deleted successfully',
    });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = () => {
    if (!formData.name || !formData.price || !formData.quantity) {
      Toast.show({
        type: 'error',
        text1: 'Missing required fields',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    const itemData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      category: formData.category,
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
      quantity: '',
      category: '',
    });
    setEditingItem(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      category: item.category,
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

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemDetails}>
          Price: ${item.price} | Quantity: {item.quantity} | Category: {item.category}
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
            />

            <TextInput
              style={styles.input}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Category"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.modalButtonText}>
                  {editingItem ? 'Update' : 'Add'}
                </Text>
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