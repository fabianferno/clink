"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { PrivyProvider, usePrivy as usePrivyHook } from "@privy-io/react-auth";
import { mendoza } from "@arkiv-network/sdk/chains";
import { StyleSheetManager } from "styled-components";
import isPropValid from "@emotion/is-prop-valid";
import { NextStepProvider, NextStepReact } from "nextstepjs";
import OnboardingCard from "@/components/onboarding-card";

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

const onboardingSteps = [
  {
    tour: "clinkTour",
    steps: [
      {
        icon: "👋",
        title: "Welcome to Clink",
        content:
          "Clink rewards people who actually show up. Build your on-chain reputation by RSVPing and checking in to events — powered by Arkiv.",
        selector: undefined,
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🗓️",
        title: "Browse Events",
        content:
          "Discover upcoming events. Filter by community tag, status (Live / Upcoming), or search by name. No wallet needed to browse.",
        selector: "#nav-events",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "✨",
        title: "Create & Host Events",
        content:
          "Organizers can create events stored directly on Arkiv. Set a title, date, location, capacity and a community tag — all on-chain.",
        selector: "#nav-create",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "✅",
        title: "RSVP & Check-in",
        content:
          "RSVP to reserve your spot. At the event, enter the 6-char code or scan the QR to check in. Each check-in mints an attendance proof on Arkiv.",
        selector: undefined,
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "📊",
        title: "Your Clink Score",
        content:
          "Your show-up rate lives on-chain. RSVPs you actually attend raise your score. A higher Clink Score builds trust with organizers.",
        selector: "#nav-profile",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🤝",
        title: "Connect with Attendees",
        content:
          "After an event, send Clink requests to verified co-attendees. Confirm connections to grow your on-chain network.",
        selector: "#nav-friends",
        side: "bottom" as const,
        showControls: true,
        showSkip: true,
      },
      {
        icon: "🚀",
        title: "Ready to go!",
        content:
          "Start by browsing events or create your own. Your identity and reputation are fully yours — stored on Arkiv, not on our servers.",
        selector: undefined,
        showControls: true,
        showSkip: false,
      },
    ],
  },
];

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
      <NextStepProvider>
        <NextStepReact steps={onboardingSteps} cardComponent={OnboardingCard}>
          <AuthFallback>
            {children}
          </AuthFallback>
        </NextStepReact>
      </NextStepProvider>
    );
  }

  const shouldForwardProp = (propName: string, target: unknown) => {
    if (typeof target === "string") {
      return isPropValid(propName);
    }
    return true;
  };

  return (
    <NextStepProvider>
      <NextStepReact steps={onboardingSteps} cardComponent={OnboardingCard}>
        <StyleSheetManager shouldForwardProp={shouldForwardProp}>
          <PrivyProvider
            appId={PRIVY_APP_ID!}
            config={{
              loginMethods: ["wallet", "email"],
              appearance: {
                theme: "dark",
                accentColor: "#22c55e",
              },
              embeddedWallets: {
                ethereum: { createOnLogin: "users-without-wallets" },
              },
              defaultChain: mendoza,
              supportedChains: [mendoza],
            }}
          >
            <PrivyAuthWrapper>{children}</PrivyAuthWrapper>
          </PrivyProvider>
        </StyleSheetManager>
      </NextStepReact>
    </NextStepProvider>
  );
}
