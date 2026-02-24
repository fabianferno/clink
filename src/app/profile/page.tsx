"use client";

import { useAuth } from "@/components/providers";
import { motion } from "framer-motion";
import { User, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";

export default function ProfilePage() {
  const { ready, authenticated, login, user } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-2xl px-4 pt-32">
          <Card>
            <CardHeader>
              <h1 className="font-malinton text-2xl font-bold">Connect to view profile</h1>
              <p className="text-muted-foreground">
                Your Clink Score and attendance history appear here after you connect.
              </p>
            </CardHeader>
            <CardContent>
              <Button onClick={login} size="lg">
                Connect wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const walletAddress = user?.wallet?.address ?? (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as { address: string } | undefined)?.address ?? "";
  const displayName = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Anonymous";

  return (
    <div className="min-h-screen">
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl px-4 pt-24 pb-16"
      >
        <h1 className="font-malinton mb-8 text-3xl font-bold">Profile</h1>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <User className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <p className="text-sm text-muted-foreground font-mono">{walletAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h3 className="font-semibold">Clink Score</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">—</span>
                <Badge variant="secondary">New</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                RSVP and check in to events to build your score.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">Attendance</h3>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0 events</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Events you&apos;ve checked in to.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Button variant="outline" asChild>
            <Link href="/events">Browse events</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
