"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearSession,
  fetchCurrentUser,
  loginRequest,
  persistSession,
  registerRequest,
  type UserApiResponse,
} from "@/lib/auth";
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  setStoredUser,
  UNAUTHORIZED_EVENT,
} from "@/lib/auth-storage";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  /** Persist tokens and sync React auth state (used by password login + SSO). */
  establishSession: (
    accessToken: string,
    userFromLogin?: UserApiResponse,
    refreshToken?: string | null,
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const cached = getStoredUser();
    if (cached) {
      setUser({ ...cached, role: cached.role ?? "doctor" });
    }

    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
      setStoredUser(profile);
    } catch {
      clearAuthStorage();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      router.replace("/login");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [router]);

  const establishSession = useCallback(
    async (
      accessToken: string,
      userFromLogin?: UserApiResponse,
      refreshToken?: string | null,
    ) => {
      const profile = await persistSession(
        accessToken,
        userFromLogin,
        refreshToken,
      );
      setUser(profile);
      return profile;
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { access_token, refresh_token, user: loginUser } =
        await loginRequest(email, password);
      return establishSession(access_token, loginUser, refresh_token);
    },
    [establishSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await registerRequest(name, email, password);
      const { access_token, refresh_token, user: loginUser } =
        await loginRequest(email, password);
      return establishSession(access_token, loginUser, refresh_token);
    },
    [establishSession],
  );

  const logout = useCallback(async () => {
    await clearSession();
    setUser(null);
    router.replace("/");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      establishSession,
      logout,
    }),
    [user, isLoading, login, register, establishSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
