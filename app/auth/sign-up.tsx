import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/auth';
import Toast from 'react-native-toast-message';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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

    try {
      setLoading(true);
      await signUp(email, password, name, phone);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Account created successfully',
        text2: 'Please check your email for verification',
        visibilityTime: 4000,
      });

      // Wait a bit for the user to read the message
      setTimeout(() => {
        // Navigate to sign-in page
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
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number (Optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        editable={!loading}
      />

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