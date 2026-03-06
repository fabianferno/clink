"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers";
import { useWallets } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, MapPin, Users, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { publicClient } from "@/lib/arkiv";
import { eq } from "@arkiv-network/sdk/query";
import { PatternGraphic } from "@/components/ui/pattern-graphic";

const hasPrivy =
  typeof process.env.NEXT_PUBLIC_PRIVY_APP_ID === "string" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "placeholder" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID.length >= 10;

interface EventData {
  entityKey: string;
  title: string;
  description: string;
  location: string;
  imageUrl?: string;
  organizerName: string;
  capacity: number;
  currentRsvps: number;
  eventTimestamp: number;
  community?: string;
  status?: string;
}

function MyEventsContent() {
  const { ready, authenticated, login, user } = useAuth();
  const { wallets } = useWallets();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const walletAddress =
    user?.wallet?.address ??
    (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as { address: string } | undefined)
      ?.address ??
    wallets[0]?.address ??
    "";

  const fetchEvents = useCallback(async () => {
    if (!walletAddress) {
      setEvents([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const now = Math.floor(Date.now() / 1000);
      const organizerNorm = walletAddress.toLowerCase();

      // Query events by organizer attribute (new events) or fallback to all + filter by payload
      const query = publicClient.buildQuery();
      let result = await query
        .where(eq("type", "event"))
        .where(eq("organizer", organizerNorm))
        .withPayload(true)
        .withAttributes(true)
        .limit(50)
        .fetch();

      // If no results from organizer attribute, fetch all events and filter by payload (legacy events)
      let entitiesToUse = result.entities;
      if (entitiesToUse.length === 0) {
        const fallbackQuery = publicClient.buildQuery();
        const fallback = await fallbackQuery
          .where(eq("type", "event"))
          .withPayload(true)
          .withAttributes(true)
          .limit(200)
          .fetch();
        entitiesToUse = fallback.entities.filter((e) => {
          const p = e.payload ? e.toJson() : {};
          const org = (p.organizerAddress as string)?.toLowerCase?.();
          return org === organizerNorm;
        });
      }

      // RSVP counts
      const rsvpQ = publicClient.buildQuery();
      const rsvpResult = await rsvpQ
        .where(eq("type", "rsvp"))
        .withAttributes(true)
        .limit(5000)
        .fetch();
      const rsvpCountByEvent: Record<string, number> = {};
      const normalizeKey = (k: string) => (k.startsWith("0x") ? k : `0x${k}`);
      for (const rsvp of rsvpResult.entities) {
        const eventKey = rsvp.attributes?.find((a) => a.key === "event_key")?.value as string | undefined;
        if (eventKey) {
          const key = normalizeKey(eventKey);
          rsvpCountByEvent[key] = (rsvpCountByEvent[key] ?? 0) + 1;
        }
      }

      const eventList: EventData[] = entitiesToUse
        .map((entity) => {
          const payload = entity.payload ? entity.toJson() : {};
          const attrs = entity.attributes || [];
          const rawTs = attrs.find((a) => a.key === "event_timestamp")?.value;
          const eventTimestamp =
            typeof rawTs === "number" ? rawTs : typeof rawTs === "string" ? parseInt(rawTs, 10) : 0;
          const entityKeyNorm = normalizeKey(entity.key);
          const currentRsvps = rsvpCountByEvent[entityKeyNorm] ?? 0;
          return {
            entityKey: entity.key,
            title: (payload?.title as string) || "Untitled Event",
            description: (payload?.description as string) || "",
            location: (payload?.location as string) || "",
            imageUrl: payload?.imageUrl as string | undefined,
            organizerName: (payload?.organizerName as string) || "Anonymous",
            capacity: (payload?.capacity as number) || 0,
            currentRsvps,
            eventTimestamp: eventTimestamp || 0,
            community: attrs.find((a) => a.key === "community")?.value as string | undefined,
            status: attrs.find((a) => a.key === "status")?.value as string | undefined,
          };
        })
        .sort((a, b) => b.eventTimestamp - a.eventTimestamp);

      setEvents(eventList);
    } catch (err) {
      console.error("Failed to fetch my events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (authenticated && walletAddress) {
      fetchEvents();
    } else {
      setEvents([]);
      setLoading(false);
    }
  }, [authenticated, walletAddress, fetchEvents]);

  if (!hasPrivy) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="mx-auto max-w-7xl px-4 pt-32 text-center">
          <h1 className="font-malinton text-2xl font-bold mb-4">My Events</h1>
          <p className="text-muted-foreground">Wallet connection is required.</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="mx-auto max-w-7xl px-4 pt-32 animate-pulse">
          <div className="h-10 w-48 bg-white/10 rounded mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-2xl" />
            ))}
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
            <Settings className="w-10 h-10 text-white/40" />
          </div>
          <h1 className="font-malinton text-4xl font-black text-white mb-4">MY EVENTS</h1>
          <p className="text-white/60 mb-8 font-medium">
            Connect your wallet to view and manage events you&apos;ve created.
          </p>
          <Button
            onClick={login}
            size="lg"
            className="w-full max-w-xs h-14 bg-primary text-black font-bold hover:bg-primary/90 text-lg"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  const upcoming = events.filter((e) => e.eventTimestamp >= Math.floor(Date.now() / 1000));
  const past = events.filter((e) => e.eventTimestamp < Math.floor(Date.now() / 1000));

  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col">
      <Header />
      <div className="absolute top-0 right-0 w-full max-w-lg h-[500px] bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full max-w-7xl mx-auto px-4 pt-28 pb-16 relative z-10"
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
            <h1 className="font-malinton text-4xl md:text-5xl font-black text-white">My Events</h1>
            <p className="text-white/50 mt-2">Manage events you&apos;ve created</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEvents}
              disabled={loading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild size="sm" className="bg-primary text-black hover:bg-primary/90 font-bold">
              <Link href="/events/create">Create Event</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-16 text-center">
            <Calendar className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <h2 className="font-malinton text-xl font-bold text-white mb-2">No events yet</h2>
            <p className="text-white/50 mb-6">Create your first event to get started.</p>
            <Button asChild className="bg-primary text-black hover:bg-primary/90 font-bold">
              <Link href="/events/create">Create Event</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-4">
                  {upcoming.map((ev) => (
                    <EventCard key={ev.entityKey} event={ev} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">
                  Past ({past.length})
                </h2>
                <div className="space-y-4">
                  {past.map((ev) => (
                    <EventCard key={ev.entityKey} event={ev} isPast />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function EventCard({ event, isPast = false }: { event: EventData; isPast?: boolean }) {
  const dateObj = new Date(event.eventTimestamp * 1000);
  const dayStr = dateObj.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141414] hover:bg-white/5 overflow-hidden transition-all hover:border-white/20 group">
      <div className="flex flex-col sm:flex-row">
        <Link href={`/events/${event.entityKey}`} className="w-full sm:w-48 h-32 sm:h-auto shrink-0 bg-white/5 relative overflow-hidden block">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <PatternGraphic seed={event.entityKey} variant="pink" className="w-full h-full" />
          )}
          {isPast && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-widest text-white/80">Past</span>
            </div>
          )}
        </Link>
        <div className="flex-1 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link href={`/events/${event.entityKey}`} className="min-w-0">
            <h3 className="font-malinton text-xl font-bold text-white truncate group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {dayStr} · {timeStr}
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {event.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {event.currentRsvps} / {event.capacity || "∞"} RSVPs
              </span>
            </div>
          </Link>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href={`/events/${event.entityKey}/checkin`}>Check-in</Link>
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href={`/events/${event.entityKey}/attendees`}>Attendees</Link>
            </Button>
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href={`/events/${event.entityKey}/edit`}>Edit</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyEventsPage() {
  return <MyEventsContent />;
}
