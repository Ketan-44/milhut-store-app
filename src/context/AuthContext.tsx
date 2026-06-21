import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY, USER_KEY } from '@/services/api';
import type { AuthResponse, User } from '@/types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setSession: (session: AuthResponse) => Promise<void>;
  clearSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([
          TOKEN_KEY,
          USER_KEY,
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken.trim());
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const setSession = useCallback(async (session: AuthResponse) => {
    const authToken = session.token.trim();
    await AsyncStorage.multiSet([
      [TOKEN_KEY, authToken],
      [USER_KEY, JSON.stringify(session.user)],
    ]);
    setToken(authToken);
    setUser(session.user);
  }, []);

  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, setSession, clearSession }),
    [user, token, isLoading, setSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
