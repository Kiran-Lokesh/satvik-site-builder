import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, signOut, getIdToken } from 'firebase/auth';
import { getFirebaseAuth, googleAuthProvider, isFirebaseEnabled } from '@/lib/firebaseClient';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseEnabled()) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (authError) => {
        console.error('Firebase auth error', authError);
        setError(authError.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    signInWithGoogle: async () => {
      if (!isFirebaseEnabled()) {
        setError('Authentication is not configured.');
        return null;
      }
      try {
        setError(null);
        const auth = getFirebaseAuth();
        const result = await signInWithPopup(auth, googleAuthProvider);
        setUser(result.user);
        return result.user;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sign in';
        setError(message);
        console.error('Google sign-in failed', err);
        return null;
      }
    },
    logout: async () => {
      if (!isFirebaseEnabled()) {
        setUser(null);
        return;
      }
      try {
        const auth = getFirebaseAuth();
        await signOut(auth);
        setUser(null);
      } catch (err) {
        console.error('Failed to sign out', err);
        setError(err instanceof Error ? err.message : 'Failed to sign out');
      }
    },
    getToken: async (forceRefresh = false) => {
      if (!isFirebaseEnabled() || !user) {
        return null;
      }
      try {
        return await getIdToken(user, forceRefresh);
      } catch (err) {
        console.error('Failed to get Firebase ID token', err);
        return null;
      }
    },
  }), [user, loading, error]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
