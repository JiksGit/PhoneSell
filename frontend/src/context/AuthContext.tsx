import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '../api/client';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 저장된 토큰 복원
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await AsyncStorage.getItem('auth_user');
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // 복원 실패 시 로그인 화면으로
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (authUser: AuthUser) => {
    await AsyncStorage.setItem('auth_user', JSON.stringify(authUser));
    await AsyncStorage.setItem('token', authUser.token);
    setUser(authUser);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('auth_user');
    await AsyncStorage.removeItem('token');
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
