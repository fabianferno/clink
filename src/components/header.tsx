"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers";
import { motion } from "framer-motion";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { ready, authenticated, login, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-malinton text-xl font-bold tracking-tight text-foreground">
            Clink
          </span>
          <Sparkles className="h-4 w-4 text-emerald-500" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Events
          </Link>
          <Link
            href="/events/create"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Create Event
          </Link>
          {authenticated && (
            <Link
              href="/profile"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Profile
            </Link>
          )}
          {ready && (
            <>
              {authenticated ? (
                <Button variant="outline" size="sm" onClick={logout}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={login}>
                  Connect to build reputation
                </Button>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/5 bg-background/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-2 px-4 py-4">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/events/create"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Event
            </Link>
            {authenticated && (
              <Link
                href="/profile"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
            )}
            {ready && (
              <div className="mt-2 pt-2 border-t border-white/5">
                {authenticated ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={logout}>
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" onClick={login}>
                    Connect to build reputation
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
