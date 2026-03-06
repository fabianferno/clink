"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, HelpCircle, Fuel, ExternalLink, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { publicClient } from "@/lib/arkiv";
import { formatEther } from "@arkiv-network/sdk";
import { useNextStep } from "nextstepjs";

const ONBOARDING_KEY = "clink_onboarding_done";
const FAUCET_URL = "https://mendoza.hoodi.arkiv.network/faucet";

function FaucetPopover({ address, onClose }: { address: string; onClose: () => void }) {
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 w-72 rounded-2xl border border-amber-500/20 bg-[#141414] shadow-[0_0_40px_rgba(245,158,11,0.15)] z-200 overflow-hidden"
    >
      {/* Amber top accent */}
      <div className="h-[2px] bg-linear-to-r from-transparent via-amber-400 to-transparent opacity-80" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20">
              <Fuel className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Need testnet ETH</p>
              <p className="text-xs text-white/40">Mendoza testnet faucet</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors mt-0.5 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-white/60 leading-relaxed mb-3">
          Your wallet has no funds. You need testnet ETH to RSVP, check in, and create events on Clink.
        </p>

        <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 mb-3 flex items-center gap-2">
          <span className="text-xs font-mono text-white/50 flex-1 truncate">{short}</span>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(address);
            }}
            className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors shrink-0 cursor-pointer"
            title="Copy address"
          >
            Copy
          </button>
        </div>

        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-9 rounded-full bg-amber-400 text-black text-sm font-black hover:bg-amber-300 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        >
          <Fuel className="h-3.5 w-3.5" />
          Open Faucet
          <ExternalLink className="h-3 w-3 opacity-60" />
        </a>

        <p className="text-[10px] text-white/30 text-center mt-2">
          Paste your address on the faucet page to receive funds
        </p>
      </div>
    </motion.div>
  );
}

function WalletBalance({ address }: { address: string }) {
  const [balance, setBalance] = useState<string | null>(null);
  const [showFaucet, setShowFaucet] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    publicClient
      .getBalance({ address: address as `0x${string}` })
      .then((b) => {
        if (!cancelled) {
          const eth = formatEther(b);
          setBalance(eth);
          if (parseFloat(eth) < 0.0001) setShowFaucet(true);
        }
      })
      .catch(() => {
        if (!cancelled) setBalance(null);
      });
    return () => { cancelled = true; };
  }, [address]);

  // Close popover on outside click
  useEffect(() => {
    if (!showFaucet) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowFaucet(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showFaucet]);

  if (balance === null) {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-white/50 animate-pulse">
        <Wallet className="h-4 w-4 text-white/30" />
        <div className="h-4 w-12 bg-white/10 rounded-md" />
      </span>
    );
  }

  const parsed = parseFloat(balance);
  const isEmpty = parsed < 0.0001;

  if (isEmpty) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setShowFaucet((v) => !v)}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all"
          title="Wallet has no funds — click to get testnet ETH"
        >
          <Fuel className="h-3.5 w-3.5" />
          No funds
        </button>
        <AnimatePresence>
          {showFaucet && (
            <FaucetPopover address={address} onClose={() => setShowFaucet(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  const display = parsed.toFixed(4);
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-white/70 tabular-nums">
      <Wallet className="h-4 w-4 text-white/50" />
      {display} ETH
    </span>
  );
}

export function Header() {
  const { ready, authenticated, login, logout, user } = useAuth();
  const { startNextStep } = useNextStep();

  const walletAddress =
    user?.wallet?.address ??
    (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as
      | { address: string }
      | undefined)?.address ??
    "";

  // Auto-trigger onboarding for first-time visitors
  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      // Small delay so the page and selectors are rendered
      const t = setTimeout(() => {
        startNextStep("clinkTour");
        localStorage.setItem(ONBOARDING_KEY, "1");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [startNextStep]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/android-chrome-192x192.png"
            alt="Clink"
            width={60}
            height={60}
            className="rounded-lg md:-ml-8 md:-mr-2"
          />
          <span className="font-malinton text-2xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
            Clink
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            id="nav-events"
            href="/events"
            className="text-sm font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
          >
            Events
          </Link>
          <Link
            id="nav-create"
            href="/events/create"
            className="text-sm font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
          >
            Create Event
          </Link>
          {authenticated && (
            <>
              <Link
                href="/events/my-events"
                className="text-sm font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
              >
                My Events
              </Link>
              <Link
                id="nav-friends"
                href="/friends"
                className="text-sm font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
              >
                Friends
              </Link>
              <Link
                id="nav-profile"
                href="/profile"
                className="text-sm font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
              >
                Profile
              </Link>
            </>
          )}
          {ready && (
            <>
              {authenticated && walletAddress && (
                <WalletBalance address={walletAddress} />
              )}
              {authenticated ? (
                <Button variant="outline" size="sm" onClick={logout} className="border-white/20 hover:bg-white/10 font-bold">
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={login} className="bg-white text-black hover:bg-white/90 font-bold">
                  Connect Wallet
                </Button>
              )}
            </>
          )}

          {/* Help / Onboarding trigger */}
          <button
            id="nav-help"
            onClick={() => startNextStep("clinkTour")}
            className="flex cursor-pointer items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
            title="Show onboarding guide"
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Navigation (Minimal) */}
        <div className="md:hidden flex items-center gap-2">
          {authenticated && walletAddress && (
            <WalletBalance address={walletAddress} />
          )}
          {ready && !authenticated && (
            <Button size="sm" onClick={login} className="bg-white text-black hover:bg-white/90 font-bold text-xs h-8 px-3">
              Connect
            </Button>
          )}
          <button
            onClick={() => startNextStep("clinkTour")}
            className="flex cursor-pointer items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white transition-all"
            title="Help"
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </nav>
    </motion.header>
  );
}
