"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, setTokens } from "@/lib/api";
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
      try {
        const response = await authApi.getCurrentUser();
        return response.data;
      } catch {
        // token ausente/inválido: descarta o que estiver no storage
        setTokens(null);
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
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
    await authApi.logout();
    // descarta o cache do usuário anterior antes de liberar a tela de login
    queryClient.clear();
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    router.push("/login");
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
