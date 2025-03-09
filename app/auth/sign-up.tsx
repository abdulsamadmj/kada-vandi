import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import Toast from 'react-native-toast-message';

export default function SignUp() {
  const [activeTab, setActiveTab] = useState<'customer' | 'vendor'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Toast.show({
        type: 'error',
        text1: 'Missing fields',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    if (activeTab === 'vendor' && !businessName) {
      Toast.show({
        type: 'error',
        text1: 'Missing business name',
        text2: 'Please enter your business name',
      });
      return;
    }

    try {
      setLoading(true);
      await signUp({
        email,
        password,
        name,
        role: activeTab,
        vendorData: activeTab === 'vendor' ? {
          business_name: businessName,
          contact,
        } : undefined,
      });
      
      Toast.show({
        type: 'success',
        text1: 'Account created successfully',
        text2: 'Please check your email for verification',
        visibilityTime: 4000,
      });

      // Wait a bit for the user to read the message
      setTimeout(() => {
        router.replace('/auth/sign-in');
      }, 2000);
      
    } catch (err) {
      console.error('Sign up error:', err);
      Toast.show({
        type: 'error',
        text1: 'Sign up failed',
        text2: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.tabContainer}>
        <Pressable 
          style={[
            styles.tab, 
            activeTab === 'customer' && styles.activeTab
          ]}
          onPress={() => setActiveTab('customer')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'customer' && styles.activeTabText
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

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />

      {activeTab === 'vendor' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Business Name"
            value={businessName}
            onChangeText={setBusinessName}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Contact Number"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </>
      )}

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
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </Pressable>

      <Link href="/auth/sign-in" style={styles.link} disabled={loading}>
        <Text style={loading ? styles.linkTextDisabled : styles.linkText}>
          Already have an account? Sign In
        </Text>
      </Link>

      <Text style={styles.infoText}>
        By signing up, you'll receive a verification email.{'\n'}
        Please verify your email before signing in.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
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
    marginBottom: 24,
  },
  linkText: {
    color: '#007AFF',
  },
  linkTextDisabled: {
    color: '#ccc',
  },
  infoText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
});