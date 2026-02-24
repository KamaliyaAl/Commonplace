import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type User = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, name: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "auth_user_v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // загрузка "сессии" (потом это будет Firebase onAuthStateChanged)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persist(u: User | null) {
    if (!u) {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    }
    setUser(u);
  }

  // ---- МОК-реализации (потом заменят на Firebase) ----
  const signInEmail = async (email: string, _password: string) => {
    await persist({ uid: "mock-uid", name: "John Smith", email });
  };

  const signUpEmail = async (email: string, _password: string, name: string) => {
    await persist({ uid: "mock-uid", name, email });
  };

  const signInGoogle = async () => {
    await persist({ uid: "mock-google", name: "Google User", email: "google.user@example.com" });
  };

  const signOut = async () => {
    await persist(null);
  };

  const updateProfile = async (patch: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...patch };
    await persist(next);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signInEmail, signUpEmail, signInGoogle, signOut, updateProfile }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}