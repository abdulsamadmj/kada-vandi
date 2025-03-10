import { Tabs } from "expo-router";
import React from "react";
import { Platform, View, Text, StyleSheet } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/cart";

function CartTabIcon({ size, color }: { size: number; color: string }) {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <View style={styles.iconContainer}>
      <Ionicons name="cart" size={size} color={color} />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { session } = useAuth();
  const isVendor = session?.user?.user_metadata.role === "vendor";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
        redirect={isVendor}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
        redirect={!isVendor}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: "Vendors",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
        redirect={isVendor}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
        redirect={!isVendor}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ size, color }) => (
            <CartTabIcon size={size} color={color} />
          ),
        }}
        redirect={isVendor}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vendor/[id]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
