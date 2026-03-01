"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { useWallets } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createArkivWalletClient } from "@/lib/arkiv-wallet";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { mendoza } from "@arkiv-network/sdk/chains";
import { Header } from "@/components/header";

const hasPrivy =
  typeof process.env.NEXT_PUBLIC_PRIVY_APP_ID === "string" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "placeholder" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID.length >= 10;

export default function CreateEventPage() {
  if (!hasPrivy) {
    return <CreateEventPageFallback />;
  }
  return <CreateEventPageWithPrivy />;
}

function CreateEventPageFallback() {
  const { ready, authenticated, login } = useAuth();
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
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-2xl px-4 pt-32">
        <Card>
          <CardHeader>
            <h1 className="font-malinton text-2xl font-bold">Connect to create event</h1>
            <p className="text-muted-foreground">
              Add NEXT_PUBLIC_PRIVY_APP_ID to your environment to enable wallet connection.
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={login} size="lg" disabled>
              Connect wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CreateEventPageWithPrivy() {
  const { ready, authenticated, login, user } = useAuth();
  const { wallets } = useWallets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    capacity: "",
    community: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated) {
      login();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error("No wallet connected. Please connect your wallet and try again.");
      }

      const provider = await wallet.getEthereumProvider();
      if (!provider) {
        throw new Error("Could not get wallet provider. Please try reconnecting your wallet.");
      }

      await wallet.switchChain(mendoza.id);

      const walletClient = createArkivWalletClient(provider, wallet.address as `0x${string}`);
      const eventTimestamp = Math.floor(new Date(`${form.date}T${form.time}`).getTime() / 1000);
      const expiresIn = ExpirationTime.fromDays(30);

      const walletAddress = user?.wallet?.address ?? (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as { address: string } | undefined)?.address ?? wallet.address;
      const organizerAddress = walletAddress;
      const organizerName = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Anonymous";

      const { entityKey } = await walletClient.createEntity({
        payload: jsonToPayload({
          title: form.title,
          description: form.description,
          location: form.location,
          imageUrl: "",
          organizerAddress,
          organizerName,
          capacity: form.capacity ? parseInt(form.capacity, 10) : 0,
          currentRsvps: 0,
        }),
        contentType: "application/json",
        attributes: [
          { key: "type", value: "event" },
          { key: "community", value: form.community || "general" },
          { key: "event_timestamp", value: eventTimestamp },
          { key: "status", value: "upcoming" },
        ],
        expiresIn,
      });

      router.push(`/events/${entityKey}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-white/50 animate-pulse font-bold tracking-widest uppercase text-sm">Preparing Studio...</p>
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
            <Calendar className="w-10 h-10 text-white/40" />
          </div>
          <h1 className="font-malinton text-4xl font-black text-white mb-4">CONNECT IDENTITY</h1>
          <p className="text-white/60 mb-8 font-medium">
            Connect your wallet to host an event on Clink and build your community reputation.
          </p>
          <Button onClick={login} size="lg" className="w-full h-14 bg-primary text-black font-bold hover:bg-primary/90 text-lg">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden flex flex-col relative">
      <Header />

      {/* Brutalist Abstract Background Art */}
      <div className="absolute top-20 right-0 w-full max-w-lg h-[600px] bg-secondary/10 blur-[140px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-full max-w-lg h-[400px] bg-primary/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full max-w-2xl mx-auto px-4 pt-28 pb-32 flex flex-col relative z-10"
      >
        <Link
          href="/events"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-white/40 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        <h1 className="font-malinton mb-10 text-5xl font-black text-white">HOST EVENT</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-2xl bg-destructive/10 border border-destructive/20 px-6 py-4 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-white/60 font-bold tracking-widest uppercase text-xs">Title <span className="text-primary">*</span></Label>
              <Input
                id="title"
                required
                placeholder="e.g. Web3 Meetup"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6 focus-visible:ring-primary focus-visible:border-primary transition-all text-lg"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-white/60 font-bold tracking-widest uppercase text-xs">Description</Label>
              <Textarea
                id="description"
                placeholder="What's this event about?"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white rounded-2xl px-6 py-4 focus-visible:ring-primary focus-visible:border-primary transition-all text-base resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="location" className="text-white/60 font-bold tracking-widest uppercase text-xs">Location <span className="text-primary">*</span></Label>
              <Input
                id="location"
                required
                placeholder="Venue or virtual link"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6 focus-visible:ring-primary focus-visible:border-primary transition-all text-base"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="date" className="text-white/60 font-bold tracking-widest uppercase text-xs">Date <span className="text-primary">*</span></Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6 focus-visible:ring-primary focus-visible:border-primary transition-all text-base block w-full appearance-none [&::-webkit-calendar-picker-indicator]:invert-[1] [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="time" className="text-white/60 font-bold tracking-widest uppercase text-xs">Time <span className="text-primary">*</span></Label>
                <div className="relative">
                  <Input
                    id="time"
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6 focus-visible:ring-primary focus-visible:border-primary transition-all text-base block w-full appearance-none [&::-webkit-calendar-picker-indicator]:invert-[1] [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="capacity" className="text-white/60 font-bold tracking-widest uppercase text-xs">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6 focus-visible:ring-primary focus-visible:border-primary transition-all text-base"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="community" className="text-white/60 font-bold tracking-widest uppercase text-xs">Community Tag</Label>
                <Input
                  id="community"
                  placeholder="e.g. eth-chennai"
                  value={form.community}
                  onChange={(e) => setForm({ ...form, community: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6 focus-visible:ring-primary focus-visible:border-primary transition-all text-base"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full h-16 text-xl bg-primary text-black hover:bg-primary/90 rounded-full font-black tracking-wide shadow-[0_0_30px_rgba(255,82,162,0.3)] hover:shadow-[0_0_40px_rgba(255,82,162,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="animate-pulse">Creating Event...</span>
              ) : (
                "LAUNCH EVENT"
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
