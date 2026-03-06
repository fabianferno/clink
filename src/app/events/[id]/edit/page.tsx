"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers";
import { useWallets } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/header";
import ShinyText from "@/components/ui/shiny-text";
import { publicClient } from "@/lib/arkiv";
import { createArkivWalletClient } from "@/lib/arkiv-wallet";
import { eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { mendoza } from "@arkiv-network/sdk/chains";

const hasPrivy =
  typeof process.env.NEXT_PUBLIC_PRIVY_APP_ID === "string" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "placeholder" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID.length >= 10;

export default function EditEventPage() {
  if (!hasPrivy) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="mx-auto max-w-7xl px-4 pt-32 text-center">
          <h1 className="font-malinton text-2xl font-bold">Wallet required</h1>
        </div>
      </div>
    );
  }
  return <EditEventPageContent />;
}

function EditEventPageContent() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, login, user } = useAuth();
  const { wallets } = useWallets();
  const entityKey = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    capacity: "",
    community: "",
    status: "upcoming" as "upcoming" | "active" | "past",
  });

  const walletAddress =
    user?.wallet?.address ??
    (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as { address: string } | undefined)
      ?.address ??
    wallets[0]?.address ??
    "";

  useEffect(() => {
    async function fetchEvent() {
      if (!entityKey || !authenticated) return;
      try {
        setLoading(true);
        const hexKey = entityKey.startsWith("0x") ? entityKey : `0x${entityKey}`;
        const entity = await publicClient.getEntity(hexKey as `0x${string}`);
        if (!entity) {
          setForbidden(true);
          setLoading(false);
          return;
        }
        const payload = entity.payload ? entity.toJson() : {};
        const attrs = entity.attributes || [];
        const organizerAddress = (payload?.organizerAddress as string) || "";
        const isOrganizer =
          organizerAddress && walletAddress
            ? organizerAddress.toLowerCase() === walletAddress.toLowerCase()
            : false;

        if (!isOrganizer) {
          setForbidden(true);
          setLoading(false);
          return;
        }

        const eventTs = (attrs.find((a) => a.key === "event_timestamp")?.value as number) || 0;
        const dateObj = new Date(eventTs * 1000);
        const dateStr = dateObj.toISOString().slice(0, 10);
        const timeStr = dateObj.toTimeString().slice(0, 5);

        setForm({
          title: (payload?.title as string) || "",
          description: (payload?.description as string) || "",
          location: (payload?.location as string) || "",
          date: dateStr,
          time: timeStr,
          capacity: (payload?.capacity as number) ? String(payload.capacity) : "",
          community: (attrs.find((a) => a.key === "community")?.value as string) || "",
          status: (attrs.find((a) => a.key === "status")?.value as "upcoming" | "active" | "past") || "upcoming",
        });
      } catch {
        setForbidden(true);
      } finally {
        setLoading(false);
      }
    }
    if (authenticated) {
      fetchEvent();
    } else {
      setLoading(false);
    }
  }, [entityKey, authenticated, walletAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated) {
      login();
      return;
    }
    const wallet = wallets[0];
    if (!wallet) {
      setError("No wallet connected.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();
      await wallet.switchChain(mendoza.id);
      const wc = createArkivWalletClient(provider, wallet.address as `0x${string}`);

      const eventTimestamp = Math.floor(new Date(`${form.date}T${form.time}`).getTime() / 1000);
      const hexKey = entityKey.startsWith("0x") ? entityKey : `0x${entityKey}`;
      const entity = await publicClient.getEntity(hexKey as `0x${string}`);
      if (!entity) throw new Error("Event not found");

      const payload = entity.payload ? entity.toJson() : {};
      const attrs = entity.attributes || [];

      await wc.updateEntity({
        entityKey: hexKey as `0x${string}`,
        payload: jsonToPayload({
          ...payload,
          title: form.title,
          description: form.description,
          location: form.location,
          capacity: form.capacity ? parseInt(form.capacity, 10) : 0,
        }),
        contentType: "application/json",
        attributes: attrs.map((a) => {
          if (a.key === "event_timestamp") return { key: "event_timestamp", value: eventTimestamp };
          if (a.key === "community") return { key: "community", value: form.community || "general" };
          if (a.key === "status") return { key: "status", value: form.status };
          return a;
        }),
        expiresIn: ExpirationTime.fromDays(30),
      });

      router.push(`/events/${entityKey}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-24 mx-auto max-w-7xl w-full text-center">
          <h1 className="font-malinton text-4xl font-black mb-4">
            <ShinyText text="Connect to edit" color="#FF52A2" shineColor="#ffffff" speed={2.5} spread={150} />
          </h1>
          <p className="text-white/60 mb-8">Connect your wallet to edit this event.</p>
          <Button onClick={login} size="lg" className="bg-primary text-black hover:bg-primary/90 font-bold">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="mx-auto max-w-7xl px-4 pt-32 animate-pulse space-y-6">
          <div className="h-10 w-48 bg-white/10 rounded" />
          <div className="h-14 w-full bg-white/10 rounded-2xl" />
          <div className="h-28 w-full bg-white/10 rounded-2xl" />
          <div className="h-14 w-full bg-white/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="mx-auto max-w-7xl px-4 pt-32 text-center">
          <h1 className="font-malinton text-2xl font-bold text-white mb-4">Access denied</h1>
          <p className="text-white/60 mb-6">Only the event organizer can edit this event.</p>
          <Link
            href={`/events/${entityKey}`}
            className="inline-flex items-center gap-2 -ml-2 px-2 py-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            <span>Back to event</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-x-hidden flex flex-col relative">
      <Header />
      <div className="absolute top-20 right-0 w-full max-w-lg h-[600px] bg-secondary/10 blur-[140px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full max-w-7xl mx-auto px-4 pt-28 pb-32 relative z-10"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <Link
              href={`/events/${entityKey}`}
              className="inline-flex items-center gap-2 -ml-2 px-2 py-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors mb-4"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              <span>Back to event</span>
            </Link>
            <h1 className="font-malinton text-4xl md:text-5xl font-black">
              <ShinyText text="Edit Event" color="#FF52A2" shineColor="#ffffff" speed={2.5} spread={150} />
            </h1>
            <p className="text-white/50 mt-2">Update your event details</p>
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
              <Label htmlFor="title" className="text-white/60 font-bold tracking-widest uppercase text-xs">
                Title <span className="text-primary">*</span>
              </Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-white/60 font-bold tracking-widest uppercase text-xs">
                Description
              </Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white rounded-2xl px-6 py-4 resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="location" className="text-white/60 font-bold tracking-widest uppercase text-xs">
                Location <span className="text-primary">*</span>
              </Label>
              <Input
                id="location"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="date" className="text-white/60 font-bold tracking-widest uppercase text-xs">
                  Date <span className="text-primary">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6 [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="time" className="text-white/60 font-bold tracking-widest uppercase text-xs">
                  Time <span className="text-primary">*</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6 [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="capacity" className="text-white/60 font-bold tracking-widest uppercase text-xs">
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="community" className="text-white/60 font-bold tracking-widest uppercase text-xs">
                  Community Tag
                </Label>
                <Input
                  id="community"
                  value={form.community}
                  onChange={(e) => setForm({ ...form, community: e.target.value })}
                  className="bg-white/5 border-white/10 text-white h-14 rounded-2xl px-6"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="status" className="text-white/60 font-bold tracking-widest uppercase text-xs">
                Status
              </Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as "upcoming" | "active" | "past" })
                }
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white px-6 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="upcoming" className="bg-[#141414] text-white">
                  Upcoming
                </option>
                <option value="active" className="bg-[#141414] text-white">
                  Live
                </option>
                <option value="past" className="bg-[#141414] text-white">
                  Ended
                </option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              disabled={saving}
              size="lg"
              className="w-full h-16 text-xl bg-primary text-black hover:bg-primary/90 rounded-full font-black"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
