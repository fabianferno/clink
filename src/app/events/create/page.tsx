"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
import { useWallets } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
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
import ShinyText from "@/components/ui/shiny-text";

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
      <div className="min-h-screen flex flex-col pt-32 px-4 items-center">
        <Header />
        <Card className="w-full max-w-7xl bg-[#141414] border-white/10">
          <CardHeader>
            <div className="h-8 w-1/2 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse mt-2" />
          </CardHeader>
          <CardContent>
            <div className="h-12 w-full bg-white/10 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-32">
        <Card>
          <CardHeader>
            <h1 className="font-malinton text-2xl font-bold">
              <ShinyText text="Connect to create event" color="#FF52A2" shineColor="#ffffff" speed={2.5} spread={150} />
            </h1>
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
          { key: "organizer", value: organizerAddress.toLowerCase() },
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
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-48 pb-32 flex flex-col relative z-10 animate-pulse">
          <div className="h-4 w-24 bg-white/10 rounded mb-8" />
          <div className="h-10 w-64 bg-white/10 rounded mb-10" />
          <div className="space-y-8">
            <div className="space-y-3"><div className="h-4 w-16 bg-white/10 rounded" /><div className="h-14 w-full bg-white/10 rounded-2xl" /></div>
            <div className="space-y-3"><div className="h-4 w-24 bg-white/10 rounded" /><div className="h-28 w-full bg-white/10 rounded-2xl" /></div>
            <div className="space-y-3"><div className="h-4 w-20 bg-white/10 rounded" /><div className="h-14 w-full bg-white/10 rounded-2xl" /></div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3"><div className="h-4 w-12 bg-white/10 rounded" /><div className="h-14 w-full bg-white/10 rounded-2xl" /></div>
              <div className="space-y-3"><div className="h-4 w-12 bg-white/10 rounded" /><div className="h-14 w-full bg-white/10 rounded-2xl" /></div>
            </div>
            <div className="h-16 w-full bg-white/10 rounded-full mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-24 mx-auto max-w-7xl w-full text-center">
          <div className="w-24 h-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-8">
            <Calendar className="w-10 h-10 text-white/40" />
          </div>
          <h1 className="font-malinton text-4xl font-black mb-4">
            <ShinyText text="CONNECT IDENTITY" color="#FF52A2" shineColor="#ffffff" speed={2.5} spread={150} />
          </h1>
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
        className="flex-1 w-full max-w-7xl mx-auto px-4 pt-28 pb-32 flex flex-col relative z-10"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 -ml-2 px-2 py-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors mb-4"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              <span>Back to Events</span>
            </Link>
            <h1 className="font-malinton text-4xl md:text-5xl font-black">
              <ShinyText text="Host Event" color="#FF52A2" shineColor="#ffffff" speed={2.5} spread={150} />
            </h1>
            <p className="text-white/50 mt-2">Create and host events on Arkiv</p>
          </div>
        </div>

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
