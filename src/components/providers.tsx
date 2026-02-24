"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { PrivyProvider, usePrivy as usePrivyHook } from "@privy-io/react-auth";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const hasValidPrivyId = PRIVY_APP_ID && PRIVY_APP_ID !== "placeholder" && PRIVY_APP_ID.length >= 10;

type AuthContextType = {
  ready: boolean;
  authenticated: boolean;
  login: () => void;
  logout: () => void;
  user?: { wallet?: { address?: string }; linkedAccounts?: { type: string; address?: string }[] };
};

const AuthContext = createContext<AuthContextType | null>(null);

function AuthFallback({ children }: { children: React.ReactNode }) {
  const [ready] = useState(true);
  const login = useCallback(() => {
    console.warn("Add NEXT_PUBLIC_PRIVY_APP_ID to enable wallet connection");
  }, []);
  const logout = useCallback(() => {}, []);

  return (
    <AuthContext.Provider value={{ ready, authenticated: false, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function PrivyAuthWrapper({ children }: { children: React.ReactNode }) {
  const privy = usePrivyHook();
  return (
    <AuthContext.Provider
      value={{
        ready: privy.ready,
        authenticated: privy.authenticated,
        login: privy.login,
        logout: privy.logout,
        user: privy.user ?? undefined,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within Providers");
  }
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (!hasValidPrivyId) {
    return (
      <AuthFallback>
        {children}
      </AuthFallback>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID!}
      config={{
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#22c55e",
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      <PrivyAuthWrapper>{children}</PrivyAuthWrapper>
    </PrivyProvider>
  );
}
