import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase/client';

interface User {
  id: string;
  name: string;
  email?: string;
  isAdmin: boolean;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Get user profile data
      const { data: profile } = await supabase
        .from('cat_app_users')
        .select('user_name, preferences')
        .eq('user_name', user.email)
        .single();

      return {
        id: user.id,
        name: profile?.user_name || user.email || '',
        email: user.email,
        isAdmin: false, // TODO: Check admin status
      };
    },
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name }: RegisterData) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      if (error) throw error;
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated: !!user,
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        register: registerMutation.mutateAsync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
