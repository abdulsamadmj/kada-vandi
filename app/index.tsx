import { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/auth';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function SplashScreenPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    async function checkSessionAndNavigate() {
      try {
        if (!loading) {
          // Hide the native splash screen
          await SplashScreen.hideAsync();
          
          // Navigate based on session state
          if (session) {
            router.replace('/(tabs)');
          } else {
            router.replace('/auth/sign-in');
          }
        }
      } catch (error) {
        console.error('Navigation error:', error);
        // In case of error, redirect to sign-in
        router.replace('/auth/sign-in');
      }
    }

    checkSessionAndNavigate();
  }, [session, loading]);

  // Return a simple view with your app logo/splash screen
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
}); 