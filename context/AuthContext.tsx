import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, PlanLevel } from '../types';

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
    // Simulate initial auth check
    const initAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Creating a mock user session for demo purposes if needed, 
      // or start with null. App.tsx seems to handle null user.
      // Let's start with null to force login flow or check local storage.
      const storedUser = localStorage.getItem('resumate_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newUser: User = {
      id: 'demo-user-123',
      email: 'demo@resumate.ai',
      name: 'Demo User',
      plan: 'free'
    };
    setUser(newUser);
    localStorage.setItem('resumate_user', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('resumate_user');
  };

  const upgradeToPlan = async (plan: PlanLevel) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (user) {
      const updatedUser = { ...user, plan };
      setUser(updatedUser);
      localStorage.setItem('resumate_user', JSON.stringify(updatedUser));
    }
    setIsLoading(false);
  };

  const cancelSubscription = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (user) {
      const updatedUser = { ...user, plan: 'free' as PlanLevel };
      setUser(updatedUser);
      localStorage.setItem('resumate_user', JSON.stringify(updatedUser));
    }
    setIsLoading(false);
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
