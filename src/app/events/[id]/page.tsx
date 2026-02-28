"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  QrCode,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PatternGraphic } from "@/components/ui/pattern-graphic";
import { cn } from "@/lib/utils";
import { publicClient } from "@/lib/arkiv";
import { eq } from "@arkiv-network/sdk/query";
import { Header } from "@/components/header";

interface EventData {
  entityKey: string;
  title: string;
  description: string;
  location: string;
  imageUrl?: string;
  organizerName: string;
  organizerAddress: string;
  capacity: number;
  currentRsvps: number;
  eventTimestamp: number;
  community?: string;
  status?: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { ready, authenticated, login } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const entityKey = params.id as string;

  useEffect(() => {
    let cancelled = false;
    const maxRetries = 4;
    const retryDelayMs = 2000;

    async function fetchEvent(retryCount = 0) {
      if (!entityKey) return;
      try {
        const hexKey = entityKey.startsWith("0x") ? entityKey : `0x${entityKey}`;
        const entity = await publicClient.getEntity(hexKey as `0x${string}`);
        if (cancelled) return;
        if (!entity) {
          if (retryCount < maxRetries) {
            setTimeout(() => fetchEvent(retryCount + 1), retryDelayMs);
            return;
          }
          setEvent(null);
          setLoading(false);
          return;
        }
        const payload = entity.payload ? entity.toJson() : {};
        const attrs = entity.attributes || [];
        setEvent({
          entityKey: entity.key,
          title: (payload?.title as string) || "Untitled Event",
          description: (payload?.description as string) || "",
          location: (payload?.location as string) || "",
          imageUrl: payload?.imageUrl as string | undefined,
          organizerName: (payload?.organizerName as string) || "Anonymous",
          organizerAddress: (payload?.organizerAddress as string) || "",
          capacity: (payload?.capacity as number) || 0,
          currentRsvps: (payload?.currentRsvps as number) || 0,
          eventTimestamp: (attrs.find((a) => a.key === "event_timestamp")?.value as number) || 0,
          community: attrs.find((a) => a.key === "community")?.value as string | undefined,
          status: attrs.find((a) => a.key === "status")?.value as string | undefined,
        });
        setLoading(false);
      } catch {
        if (cancelled) return;
        if (retryCount < maxRetries) {
          setTimeout(() => fetchEvent(retryCount + 1), retryDelayMs);
          return;
        }
        setEvent(null);
        setLoading(false);
      }
    }
    fetchEvent();
    return () => {
      cancelled = true;
    };
  }, [entityKey]);

  const handleRsvp = async () => {
    if (!authenticated) {
      login();
      return;
    }
    setRsvpLoading(true);
    // TODO: Implement RSVP via Arkiv createEntity
    setRsvpLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-2xl px-4 pt-32 text-center">
          <h1 className="font-malinton mb-4 text-2xl font-bold">Event not found</h1>
          <Button asChild>
            <Link href="/events">Back to events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isPast = event.eventTimestamp < Math.floor(Date.now() / 1000);

  const dateObj = new Date(event.eventTimestamp * 1000);
  const dayStr = dateObj.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" }).replace("/", ".");
  const yearStr = dateObj.getFullYear().toString();
  const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col">
      <Header />

      {/* Background abstract decoration */}
      <div className="absolute top-0 right-0 w-full max-w-lg h-[500px] bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full max-w-md mx-auto px-4 pt-28 pb-12 flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            Ticket <span className="text-primary">✦</span>
          </h1>
          <Link
            href="/events"
            className="text-white hover:text-primary transition-colors flex items-center justify-center w-10 h-10 rounded-full border border-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>

        {/* The Ticket Card */}
        <div className="bg-[#141414] rounded-[2rem] w-full flex flex-col relative border border-white/5 shadow-2xl overflow-hidden flex-1 min-h-[600px]">

          {/* Top Graphic Area */}
          <div className="p-4 w-full aspect-[4/3]">
            <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative bg-muted">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PatternGraphic seed={event.entityKey} variant="pink" />
              )}

              {/* Floating Date on Graphic */}
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="text-white font-bold text-lg">{dayStr} <span className="font-normal opacity-80">{yearStr}</span></span>
              </div>
            </div>
          </div>

          {/* Ticket Info Area */}
          <div className="px-8 pb-4">
            <h2 className="font-malinton text-4xl font-bold text-white leading-tight mb-2">
              {event.title}
            </h2>
            <p className="text-white/60 text-sm mb-8 line-clamp-2">
              {event.community ? `${event.community} • ` : ""}{event.location || "Location TBA"}
            </p>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-y-8 gap-x-4 mb-8">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Date</p>
                <p className="text-white font-bold text-lg">{dayStr} {yearStr}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Time</p>
                <p className="text-white font-bold text-lg">{timeStr}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">RSVPs</p>
                <p className="text-white font-bold text-lg">{event.currentRsvps} <span className="text-sm font-normal text-white/50">/ {event.capacity || "∞"}</span></p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Organizer</p>
                <p className="text-white font-bold text-lg truncate">{event.organizerName}</p>
              </div>
            </div>
          </div>

          {/* Ticket Dotted Separator */}
          <div className="w-full relative py-2">
            <div className="absolute w-8 h-8 rounded-full bg-black -left-4 top-1/2 -translate-y-1/2 z-10" />
            <div className="w-full border-t-[3px] border-dashed border-white/10" />
            <div className="absolute w-8 h-8 rounded-full bg-black -right-4 top-1/2 -translate-y-1/2 z-10" />
          </div>

          {/* Bottom Barcode / Action Area */}
          <div className="p-8 mt-auto flex flex-col gap-4">
            {!isPast && (
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-white text-black hover:bg-white/90 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                onClick={handleRsvp}
                disabled={rsvpLoading}
              >
                {authenticated ? (rsvpLoading ? "RSVPing..." : "RSVP Now") : "Connect to RSVP"}
              </Button>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full border-white/20 text-white hover:bg-white/10" asChild>
                <Link href={`/events/${entityKey}/checkin`}>
                  Check-in
                </Link>
              </Button>
              <Button variant="outline" className="flex-1 rounded-full border-white/20 text-white hover:bg-white/10" asChild>
                <Link href={`/events/${entityKey}/attendees`}>
                  Attendees
                </Link>
              </Button>
            </div>

            {/* Visual Barcode */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-white/30">
              <span className="font-mono text-xs tracking-widest">{entityKey.slice(0, 12)}...</span>
              <svg width="100" height="24" viewBox="0 0 100 24" fill="currentColor">
                {/* Random lines mimicking a barcode */}
                {Array.from({ length: 30 }).map((_, i) => (
                  <rect key={i} x={i * 3 + (Math.random() * 2)} y="0" width={Math.random() > 0.5 ? 2 : 1} height="24" />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
