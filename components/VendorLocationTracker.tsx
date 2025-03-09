import React, { useEffect, useRef, useState } from 'react';
import { View, Switch, Text, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';
import Toast from 'react-native-toast-message';

export function VendorLocationTracker() {
  const { session } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    // Check location permission when component mounts
    checkLocationPermission();
    fetchVendorId();
    
    // Cleanup subscription when component unmounts
    return () => {
      stopLocationTracking();
    };
  }, []);

  const fetchVendorId = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (error) throw error;
      if (data) setVendorId(data.id);
    } catch (error) {
      console.error('Error fetching vendor ID:', error);
      Toast.show({
        type: 'error',
        text1: 'Error fetching vendor details',
        text2: 'Please try again later',
      });
    }
  };

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Location permission denied',
        text2: 'Please enable location services to use this feature',
      });
      setIsActive(false);
    }
  };

  const startLocationTracking = async () => {
    if (!vendorId) {
      Toast.show({
        type: 'error',
        text1: 'Vendor ID not found',
        text2: 'Please try again later',
      });
      setIsActive(false);
      return;
    }

    try {
      // First, update the active status
      const { error: statusError } = await supabase
        .from('vendor_locations')
        .upsert({
          vendor_id: vendorId,
          is_active: true,
          updated_at: new Date().toISOString(),
        });

      if (statusError) throw statusError;

      // Start location updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          try {
            // Update location in vendor_locations table
            const { error } = await supabase
              .from('vendor_locations')
              .upsert({
                vendor_id: vendorId,
                location: `POINT(${location.coords.longitude} ${location.coords.latitude})`,
                is_active: true,
                updated_at: new Date().toISOString(),
              });

            if (error) throw error;
          } catch (error) {
            console.error('Error updating location:', error);
            Toast.show({
              type: 'error',
              text1: 'Location update failed',
              text2: 'Please check your connection',
            });
          }
        }
      );

      locationSubscription.current = subscription;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to start tracking',
        text2: 'Please try again',
      });
      setIsActive(false);
    }
  };

  const stopLocationTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (vendorId) {
      try {
        // Update the active status to false
        const { error } = await supabase
          .from('vendor_locations')
          .upsert({
            vendor_id: vendorId,
            is_active: false,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error updating active status:', error);
      }
    }
  };

  const handleToggle = async (value: boolean) => {
    if (value && permissionStatus !== 'granted') {
      await checkLocationPermission();
      return;
    }

    setIsActive(value);
    if (value) {
      await startLocationTracking();
    } else {
      await stopLocationTracking();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.text}>Active Status</Text>
        <Switch
          value={isActive}
          onValueChange={handleToggle}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isActive ? '#007AFF' : '#f4f3f4'}
        />
      </View>
      <Text style={styles.status}>
        {isActive ? 'You are visible to customers' : 'You are currently offline'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
}); 