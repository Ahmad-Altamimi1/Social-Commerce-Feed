"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/nextjs";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { withBasePath } from "./base-path";

export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();

  useEffect(() => {
    setAuthTokenGetter(async () => (await getToken()) ?? null);
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  const login = () => {
    void clerk.openSignIn({
      fallbackRedirectUrl: withBasePath("/dashboard"),
      forceRedirectUrl: withBasePath("/dashboard"),
    });
  };

  const logout = () => {
    void clerk.signOut({ redirectUrl: withBasePath("/") });
  };

  const user: AuthUser | null =
    isSignedIn && clerkUser
      ? {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          firstName: clerkUser.firstName ?? undefined,
          lastName: clerkUser.lastName ?? undefined,
          profileImageUrl: clerkUser.imageUrl ?? undefined,
        }
      : null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading: !isLoaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
