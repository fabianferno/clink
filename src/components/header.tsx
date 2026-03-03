"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers";
import { motion } from "framer-motion";
import { Sparkles, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { publicClient } from "@/lib/arkiv";
import { formatEther } from "@arkiv-network/sdk";

function WalletBalance({ address }: { address: string }) {
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    publicClient
      .getBalance({ address: address as `0x${string}` })
      .then((b) => {
        if (!cancelled) setBalance(formatEther(b));
      })
      .catch(() => {
        if (!cancelled) setBalance(null);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (balance === null) {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-white/50 animate-pulse">
        <Wallet className="h-4 w-4 text-white/30" />
        <div className="h-4 w-12 bg-white/10 rounded-md"></div>
      </span>
    );
  }

  const display = parseFloat(balance) < 0.0001 ? "<0.0001" : parseFloat(balance).toFixed(4);
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-white/70 tabular-nums">
      <Wallet className="h-4 w-4 text-white/50" />
      {display} ETH
    </span>
  );
}

export function Header() {
  const { ready, authenticated, login, logout, user } = useAuth();
  const walletAddress =
    user?.wallet?.address ??
    (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as
      | { address: string }
      | undefined)?.address ??
    "";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-malinton text-2xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
            Clink
          </span>
          <Sparkles className="h-5 w-5 text-primary" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/about"
            className="text-sm font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
          >
            About
          </Link>
          <Link
            href="/events"
            className="text-sm font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
          >
            Events
          </Link>
          <Link
            href="/events/create"
            className="text-sm font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
          >
            Create Event
          </Link>
          {authenticated && (
            <>
              <Link
                href="/friends"
                className="text-sm font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
              >
                Friends
              </Link>
              <Link
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
        </div>
      </nav>
    </motion.header>
  );
}
