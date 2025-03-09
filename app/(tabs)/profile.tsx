import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import { useCart } from '../../contexts/cart';
import Toast from 'react-native-toast-message';
import { useState } from 'react';
import { AlertDialog } from '../../components/AlertDialog';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { getTotalAmount, getItemCount } = useCart();
  const userData = session?.user?.user_metadata;
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      Toast.show({
        type: 'success',
        text1: 'Signed out successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error signing out',
        text2: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <Image 
            source={{ 
              uri: userData?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
            }} 
            style={styles.avatar} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{userData?.name || 'User'}</Text>
            <Text style={styles.email}>{session?.user?.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            onPress={() => router.push('/(tabs)/cart')}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}>
            <View style={styles.menuItemContent}>
              <Ionicons name="cart-outline" size={24} color="#666666" />
              <Text style={styles.menuItemText}>Cart</Text>
              {getItemCount() > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {getItemCount()} • ₦{getTotalAmount().toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666666" />
          </Pressable>

          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}>
            <View style={styles.menuItemContent}>
              <Ionicons name="person-outline" size={24} color="#666666" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666666" />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setShowLogoutConfirm(true)}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>

      <AlertDialog
        isVisible={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleSignOut();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
});