import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export interface DeliveryAddress {
  id: string;
  label: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
}

interface DeliveryAddressContextType {
  addresses: DeliveryAddress[];
  selectedAddress: DeliveryAddress | null;
  addAddress: (address: Omit<DeliveryAddress, 'id'>) => Promise<void>;
  updateAddress: (address: DeliveryAddress) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  selectAddress: (address: DeliveryAddress | null) => void;
}

const DeliveryAddressContext = createContext<DeliveryAddressContextType | undefined>(undefined);

const STORAGE_KEY = '@delivery_addresses';

export function DeliveryAddressProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const storedAddresses = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedAddresses) {
        const parsedAddresses = JSON.parse(storedAddresses);
        setAddresses(parsedAddresses);
        
        // Set default address as selected
        const defaultAddress = parsedAddresses.find((addr: DeliveryAddress) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error loading addresses',
        text2: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const saveAddresses = async (newAddresses: DeliveryAddress[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newAddresses));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error saving addresses',
        text2: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const addAddress = async (address: Omit<DeliveryAddress, 'id'>) => {
    try {
      const newAddress: DeliveryAddress = {
        ...address,
        id: Date.now().toString(),
      };

      // If this is the first address, make it default
      if (addresses.length === 0) {
        newAddress.isDefault = true;
      }

      const newAddresses = [...addresses, newAddress];
      setAddresses(newAddresses);
      await saveAddresses(newAddresses);

      // If this is the first address or marked as default, select it
      if (newAddress.isDefault) {
        setSelectedAddress(newAddress);
      }

      Toast.show({
        type: 'success',
        text1: 'Address added successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error adding address',
        text2: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const updateAddress = async (updatedAddress: DeliveryAddress) => {
    try {
      const newAddresses = addresses.map(addr => 
        addr.id === updatedAddress.id ? updatedAddress : addr
      );
      setAddresses(newAddresses);
      await saveAddresses(newAddresses);

      // Update selected address if it was the one modified
      if (selectedAddress?.id === updatedAddress.id) {
        setSelectedAddress(updatedAddress);
      }

      Toast.show({
        type: 'success',
        text1: 'Address updated successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error updating address',
        text2: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const newAddresses = addresses.filter(addr => addr.id !== id);
      setAddresses(newAddresses);
      await saveAddresses(newAddresses);

      // If deleted address was selected, clear selection
      if (selectedAddress?.id === id) {
        setSelectedAddress(null);
      }

      // If deleted address was default and we have other addresses,
      // make the first one default
      if (addresses.find(addr => addr.id === id)?.isDefault && newAddresses.length > 0) {
        const firstAddress = { ...newAddresses[0], isDefault: true };
        const updatedAddresses = [
          firstAddress,
          ...newAddresses.slice(1).map(addr => ({ ...addr, isDefault: false }))
        ];
        setAddresses(updatedAddresses);
        await saveAddresses(updatedAddresses);
        setSelectedAddress(firstAddress);
      }

      Toast.show({
        type: 'success',
        text1: 'Address deleted successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error deleting address',
        text2: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      const newAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }));
      setAddresses(newAddresses);
      await saveAddresses(newAddresses);

      // Update selected address to the new default
      const newDefault = newAddresses.find(addr => addr.id === id);
      if (newDefault) {
        setSelectedAddress(newDefault);
      }

      Toast.show({
        type: 'success',
        text1: 'Default address updated',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error updating default address',
        text2: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const selectAddress = (address: DeliveryAddress | null) => {
    setSelectedAddress(address);
  };

  return (
    <DeliveryAddressContext.Provider
      value={{
        addresses,
        selectedAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        selectAddress,
      }}
    >
      {children}
    </DeliveryAddressContext.Provider>
  );
}

export function useDeliveryAddress() {
  const context = useContext(DeliveryAddressContext);
  if (context === undefined) {
    throw new Error('useDeliveryAddress must be used within a DeliveryAddressProvider');
  }
  return context;
} 