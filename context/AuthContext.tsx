import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, PlanLevel } from '../types';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check active sessions
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { plan } = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'User',
          plan: (plan as PlanLevel) || 'free'
        });
      }
      setIsLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { plan } = session.user.user_metadata || {};
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'User',
          plan: (plan as PlanLevel) || 'free'
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async () => {
    // For demo simplicity, we'll try Google OAuth, or fallback to email magic link
    // Adjust based on your Supabase settings
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // This should ideally be handled by a webhook listening to Stripe events.
  // For now, this calls our Stripe service which (in a real backend app)
  // would create a checkout session.
  // After payment, the user is redirected back, and we might optimistically update the plan,
  // or more securely, refresh the session from the server.
  const upgradeToPlan = async (plan: PlanLevel) => {
    // The actual upgrade trigger happens via Stripe redirect in App.tsx
    // This context function might update the local state optimistically if needed
    // But primarily we rely on App.tsx calling createCheckoutSession.
    // For local state update after successful return:
    if (user) {
      // Optimistic update (simulated for immediate feedback on success return)
      const updatedUser = { ...user, plan };
      setUser(updatedUser);

      // Also attempt to update metadata in Supabase (insecure for real apps, better done via backend)
      await supabase.auth.updateUser({
        data: { plan: plan }
      });
    }
  };

  const cancelSubscription = async () => {
    if (user) {
      const updatedUser = { ...user, plan: 'free' as PlanLevel };
      setUser(updatedUser);
      await supabase.auth.updateUser({
        data: { plan: 'free' }
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      upgradeToPlan,
      cancelSubscription
    }}>
      {children}
    </AuthContext.Provider>
  );
};
