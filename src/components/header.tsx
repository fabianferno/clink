"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers";
import { motion } from "framer-motion";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { ready, authenticated, login, logout } = useAuth();

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
            <Link
              href="/profile"
              className="text-sm font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-white"
            >
              Profile
            </Link>
          )}
          {ready && (
            <>
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
        <div className="md:hidden flex items-center">
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
