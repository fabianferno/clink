"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";
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
import { Header } from "@/components/header";

export default function CreateEventPage() {
  const { ready, authenticated, login, user } = useAuth();
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
      const ethereumProvider = typeof window !== "undefined" ? (window as { ethereum?: unknown }).ethereum : undefined;
      if (!ethereumProvider) {
        throw new Error("Please connect your wallet (MetaMask or similar)");
      }

      const walletClient = createArkivWalletClient(ethereumProvider);
      const eventTimestamp = Math.floor(new Date(`${form.date}T${form.time}`).getTime() / 1000);
      const expiresIn = ExpirationTime.fromDays(30);

      const walletAddress = user?.wallet?.address ?? (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as { address: string } | undefined)?.address ?? "";
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
              <h1 className="font-malinton text-2xl font-bold">Connect to create event</h1>
              <p className="text-muted-foreground">
                Connect your wallet to create an event on Clink.
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

  return (
    <div className="min-h-screen">
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl px-4 pt-32 pb-16"
      >
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        <h1 className="font-malinton mb-8 text-3xl font-bold">Create event</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g. Web3 Meetup"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's this event about?"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Venue or virtual link"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (optional)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="community">Community</Label>
                <Input
                  id="community"
                  placeholder="e.g. eth-chennai"
                  value={form.community}
                  onChange={(e) => setForm({ ...form, community: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} size="lg" className="gap-2">
              {loading ? (
                "Creating..."
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Create event
                </>
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/">Cancel</Link>
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
