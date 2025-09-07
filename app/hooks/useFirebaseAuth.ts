'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useFirebaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!auth) {
      // Firebase no disponible (SSR o env faltantes)
      setAuthState(prev => ({ ...prev, loading: false }));
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({
        user,
        loading: false,
        error: null
      });
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (!auth) throw new Error('Auth no disponible');
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      if (!auth) throw new Error('Auth no disponible');
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (!auth) return;
      await signOut(auth);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage 
      }));
      throw error;
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    logout
  };
};