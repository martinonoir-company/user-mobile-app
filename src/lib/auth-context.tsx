import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { api } from './api';
import { AuthResponse } from './api-types';
import { tokenStore } from './token-store';

interface User {
  id: string;
  email: string;
  role: string;
  country: string;
  currency: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  currency: string;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    countryCode: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function base64UrlDecode(input: string): string {
  const pad = input.length % 4;
  const padded = pad ? input + '='.repeat(4 - pad) : input;
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof globalThis.atob === 'function') return globalThis.atob(base64);
  // Hermes/React Native lacks atob reliably in some configs — manual decode.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < base64.length; ) {
    const a = chars.indexOf(base64.charAt(i++));
    const b = chars.indexOf(base64.charAt(i++));
    const c = chars.indexOf(base64.charAt(i++));
    const d = chars.indexOf(base64.charAt(i++));
    const triplet = (a << 18) | (b << 12) | ((c & 63) << 6) | (d & 63);
    output += String.fromCharCode((triplet >> 16) & 0xff);
    if (c !== 64) output += String.fromCharCode((triplet >> 8) & 0xff);
    if (d !== 64) output += String.fromCharCode(triplet & 0xff);
  }
  return output;
}

function parseJwt(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return {};
    return JSON.parse(base64UrlDecode(parts[1]!));
  } catch {
    return {};
  }
}

function tokenToUser(token: string): User | null {
  const payload = parseJwt(token);
  const sub = payload['sub'] as string | undefined;
  if (!sub) return null;
  return {
    id: sub,
    email: (payload['email'] as string) ?? '',
    role: (payload['role'] as string) ?? 'customer',
    country: (payload['country'] as string) ?? 'NG',
    currency: (payload['currency'] as string) ?? 'NGN',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const applyTokens = useCallback(async (access: string, refresh: string) => {
    api.setTokens(access, refresh);
    await tokenStore.save(access, refresh);
    setUser(tokenToUser(access));
  }, []);

  const logout = useCallback(async () => {
    clearRefreshTimer();
    const rt = api.getRefreshToken();
    if (rt) {
      // Fire-and-forget; never block UI on server-side session revoke.
      api.logout(rt).catch(() => {});
    }
    api.setTokens(null, null);
    await tokenStore.clear();
    setUser(null);
  }, []);

  // Hook api client → on unauthorized after failed refresh, nuke session.
  useEffect(() => {
    api.setOnUnauthorized(() => {
      void logout();
    });
    return () => api.setOnUnauthorized(null);
  }, [logout]);

  // Restore persisted session on boot.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { accessToken, refreshToken } = await tokenStore.load();
      if (cancelled) return;
      if (accessToken && refreshToken) {
        api.setTokens(accessToken, refreshToken);
        const restored = tokenToUser(accessToken);
        if (restored) setUser(restored);
      }
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Periodic silent refresh — matches the 12-minute cadence the web app uses
  // for a 15-minute access token lifetime. Any 401 between ticks is also
  // handled by the client's own request-level refresh.
  useEffect(() => {
    clearRefreshTimer();
    if (!user) return;
    const id = setInterval(async () => {
      const rt = api.getRefreshToken();
      if (!rt) return;
      try {
        const result = await api.refresh(rt);
        await applyTokens(result.data.accessToken, result.data.refreshToken);
      } catch {
        await logout();
      }
    }, 12 * 60 * 1000);
    refreshTimerRef.current = id;
    return () => clearInterval(id);
  }, [user, applyTokens, logout]);

  const handleAuthResponse = useCallback(
    async (data: AuthResponse) => {
      await applyTokens(data.accessToken, data.refreshToken);
    },
    [applyTokens],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.login(email, password);
      await handleAuthResponse(result.data);
    },
    [handleAuthResponse],
  );

  const register = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      countryCode: string;
    }) => {
      const result = await api.register(data);
      await handleAuthResponse(result.data);
    },
    [handleAuthResponse],
  );

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    currency: user?.currency ?? 'NGN',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
