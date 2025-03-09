import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../contexts/auth';
import { CartProvider } from '../contexts/cart';
import { useColorScheme } from '@/hooks/useColorScheme';
import Toast from 'react-native-toast-message';
import { View, Linking } from 'react-native';
import { supabase } from '../lib/supabase';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'auth';

    if (session && inAuthGroup) {
      router.replace('/');
    } else if (!session && !inAuthGroup) {
      router.replace('/auth/sign-in');
    }
  }, [session, isReady, segments]);

  if (!isReady) {
    return null;
  }

  return (
    <CartProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </CartProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [appIsReady, setAppIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {
        // Keep splash screen visible while we check resources
        await SplashScreen.preventAutoHideAsync();
        // Load any resources or data here
        await Promise.all([]);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady && loaded) {
      // Hide splash screen once everything is ready
      SplashScreen.hideAsync();
    }
  }, [appIsReady, loaded]);

  // useEffect(() => {
  //   // Handle deep linking
  //   const handleDeepLink = async ({ url }: { url: string }) => {
  //     if (url.includes('type=recovery') || url.includes('type=signup')) {
  //       try {
  //         const { data: { session }, error } = await supabase.auth.verifyOtp({
  //           type: url.includes('type=recovery') ? 'recovery' : 'signup',
  //           token: url.split('token=')[1].split('&')[0],
  //         });

  //         if (error) throw error;

  //         // Always redirect to sign-in page with a success message
  //         Toast.show({
  //           type: 'success',
  //           text1: 'Email verified successfully',
  //           text2: 'Please sign in to continue',
  //           visibilityTime: 4000,
  //         });
          
  //         // If there was a session, sign out to ensure clean login
  //         if (session) {
  //           await supabase.auth.signOut();
  //         }
          
  //         // Redirect to sign-in page
  //         router.replace('/auth/sign-in');
          
  //       } catch (error) {
  //         console.error('Verification error:', error);
  //         Toast.show({
  //           type: 'error',
  //           text1: 'Verification failed',
  //           text2: error instanceof Error ? error.message : 'Please try again',
  //           visibilityTime: 4000,
  //         });
  //         router.replace('/auth/sign-in');
  //       }
  //     }
  //   };

  //   // Add event listener for deep links
  //   const subscription = Linking.addEventListener('url', handleDeepLink);

  //   // Handle initial URL
  //   Linking.getInitialURL().then((url) => {
  //     if (url) {
  //       handleDeepLink({ url });
  //     }
  //   });

  //   return () => {
  //     subscription.remove();
  //   };
  // }, []);

  if (!appIsReady || !loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
      <Toast />
    </ThemeProvider>
  );
}
