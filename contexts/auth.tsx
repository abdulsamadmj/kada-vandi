import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

type UserRole = 'customer' | 'vendor';

interface VendorData {
  business_name: string;
  contact?: string;
}

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signUp: (params: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    vendorData?: VendorData;
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize session state
    const initializeSession = async () => {
      try {
        // Get the current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(currentSession);

        // Set up real-time session updates
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const signUp = async ({ email, password, name, role, vendorData }: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    vendorData?: VendorData;
  }) => {
    try {
      // 1. Sign up the user with Supabase Auth
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('User creation failed');

      // 2. Insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,
            email: email,
            name: name,
            role: role,
          }
        ]);

      if (userError) throw userError;

      // 3. If role is vendor, insert vendor data
      if (role === 'vendor' && vendorData) {
        const { error: vendorError } = await supabase
          .from('vendors')
          .insert([
            {
              user_id: user.id,
              business_name: vendorData.business_name,
              contact: vendorData.contact,
            }
          ]);

        if (vendorError) throw vendorError;
      }
    } catch (error) {
      // If any step fails, attempt to clean up
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};