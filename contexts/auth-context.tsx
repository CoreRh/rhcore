"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, setTokens, getAccessToken } from "@/lib/api";
import type {
  User,
  LoginCredentials,
  UserRole,
  AppPermission,
} from "@/lib/types";

const AUTH_QUERY_KEY = ["auth", "me"] as const;

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasAppPermission: (AppPermission: AppPermission) => boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user = null, isPending: isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async (): Promise<User | null> => {
      if (!getAccessToken()) return null;

      try {
        const response = await authApi.getCurrentUser();
        return response.data;
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;

        if (statusCode === 401) {
          setTokens(null);
          return null;
        }
        throw error;
      }
    },
    staleTime: Infinity,
    retry: (failureCount, error) => {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 401) return false;
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });

  const hasAppPermission = useCallback(
    (permission: AppPermission): boolean => {
      if (!user) return false;
      if (user.ROLE === "ADMIN") return true;
      return user.PERMISSIONS?.includes(permission) ?? false;
    },
    [user],
  );

  const login = async (credentials: LoginCredentials) => {
    await authApi.login(credentials);
    const userResponse = await authApi.getCurrentUser();
    queryClient.setQueryData(AUTH_QUERY_KEY, userResponse.data);
    router.push("/");
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.ROLE || null,
        isLoading,
        isAuthenticated: !!user,
        hasAppPermission,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
