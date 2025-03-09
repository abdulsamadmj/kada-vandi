import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import Toast from 'react-native-toast-message';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
        .select('role, name')
        .eq('email', email)
        .single();

      if (userError) throw userError;

      const isVendor = userData?.role === 'vendor';
      
      Toast.show({
        type: 'success',
        text1: `Welcome back${userData?.name ? `, ${userData.name}` : ''}!`,
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
      <Text style={styles.title}>Welcome Back</Text>

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
});