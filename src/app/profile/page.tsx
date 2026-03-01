"use client";

import { useAuth } from "@/components/providers";
import { motion } from "framer-motion";
import { User, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { PatternGraphic } from "@/components/ui/pattern-graphic";

export default function ProfilePage() {
  const { ready, authenticated, login, user } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-white/50 animate-pulse font-bold tracking-widest uppercase text-sm">Loading Identity...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-24 mx-auto max-w-lg w-full text-center">
          <div className="w-24 h-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-8">
            <User className="w-10 h-10 text-white/40" />
          </div>
          <h1 className="font-malinton text-4xl font-black text-white mb-4">CONNECT IDENTITY</h1>
          <p className="text-white/60 mb-8 font-medium">
            Your Clink Score and attendance history appear here after you connect. Built fully on Arkiv.
          </p>
          <Button onClick={login} size="lg" className="w-full h-14 bg-primary text-black font-bold hover:bg-primary/90 text-lg">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  const walletAddress = user?.wallet?.address ?? (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as { address: string } | undefined)?.address ?? "0x000000000000000000";
  const displayName = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <div className="min-h-screen bg-black overflow-x-hidden flex flex-col relative">
      <Header />

      {/* Brutalist Abstract Background Art */}
      <div className="absolute top-0 right-0 w-full max-w-lg h-[500px] bg-secondary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full max-w-lg h-[400px] bg-primary/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full max-w-md mx-auto px-4 pt-28 pb-12 flex flex-col relative z-10"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            Identity <span className="text-secondary">✦</span>
          </h1>
        </div>

        {/* Identity Ticket Layout */}
        <div className="bg-[#141414] rounded-[2rem] w-full flex flex-col border border-white/5 shadow-2xl overflow-hidden relative">

          {/* Avatar Area */}
          <div className="p-6 pb-2 w-full flex flex-col items-center">
            <div className="w-32 h-32 rounded-[1.5rem] overflow-hidden border-2 border-white/10 relative mb-6 shrink-0 bg-black">
              <PatternGraphic seed={walletAddress} variant="pink" className="scale-150 transform origin-center" />
            </div>
            <h2 className="font-malinton text-4xl font-bold text-white leading-tight mb-2 text-center break-all">
              {displayName}
            </h2>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-full max-w-[280px]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <p className="text-white/60 text-xs font-mono truncate w-full">
                {walletAddress}
              </p>
            </div>
          </div>

          {/* Dotted Separator */}
          <div className="w-full relative py-6">
            <div className="absolute w-8 h-8 rounded-full bg-black -left-4 top-1/2 -translate-y-1/2 z-10" />
            <div className="w-full border-t-[3px] border-dashed border-white/10" />
            <div className="absolute w-8 h-8 rounded-full bg-black -right-4 top-1/2 -translate-y-1/2 z-10" />
          </div>

          {/* Core Stats Area */}
          <div className="px-8 pb-8 flex flex-col gap-6">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 h-16 text-primary" />
              </div>
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Clink Score</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black text-white leading-none tracking-tighter">—</span>
                <Badge variant="secondary" className="bg-secondary text-black font-bold uppercase tracking-widest text-[10px] h-6">Beta</Badge>
              </div>
              <p className="mt-4 text-xs text-white/50 font-medium max-w-[80%]">
                Attend events and check in to build your on-chain reputation score.
              </p>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="w-16 h-16 text-secondary" />
              </div>
              <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Events Attended</p>
              <div className="flex flex-col">
                <span className="text-4xl font-black text-white leading-none tracking-tighter">0</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-8 pt-0 mt-auto flex flex-col gap-4">
            <Button
              size="lg"
              className="w-full h-14 text-lg bg-white text-black hover:bg-white/90 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              asChild
            >
              <Link href="/events">Explore Events</Link>
            </Button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
