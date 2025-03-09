import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
}

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing fields',
        text2: 'Please fill in all fields',
      });
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);

      // Fetch user role from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', email)
        .single();

      if (userError) throw userError;

      const role = userData?.role;
      const isVendor = role === 'vendor';

      if ((isVendor && activeTab !== 'vendor') || (!isVendor && activeTab === 'vendor')) {
        Toast.show({
          type: 'error',
          text1: 'Invalid account type',
          text2: `Please sign in as a ${isVendor ? 'vendor' : 'customer'}`,
        });
        await supabase.auth.signOut();
        return;
      }

      Toast.show({
        type: 'success',
        text1: `Welcome back${isVendor ? ' Vendor' : ''}!`,
      });
    } catch (err) {
      console.error('Sign in error:', err);
      Toast.show({
        type: 'error',
        text1: 'Sign in failed',
        text2: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Pressable 
          style={[
            styles.tab, 
            activeTab === 'user' && styles.activeTab
          ]}
          onPress={() => setActiveTab('user')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'user' && styles.activeTabText
          ]}>Customer</Text>
        </Pressable>
        <Pressable 
          style={[
            styles.tab, 
            activeTab === 'vendor' && styles.activeTab
          ]}
          onPress={() => setActiveTab('vendor')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'vendor' && styles.activeTabText
          ]}>Vendor</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>
        {activeTab === 'user' ? 'Welcome Back' : 'Vendor Sign In'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <Pressable 
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          loading && styles.buttonDisabled
        ]} 
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </Pressable>

      <Link href="/auth/sign-up" style={styles.link} disabled={loading}>
        <Text style={loading ? styles.linkTextDisabled : styles.linkText}>
          Don't have an account? Sign Up
        </Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    alignSelf: 'center',
  },
  linkText: {
    color: '#007AFF',
  },
  linkTextDisabled: {
    color: '#ccc',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});