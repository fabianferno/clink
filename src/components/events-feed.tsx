"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Users, RefreshCw, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatternGraphic } from "@/components/ui/pattern-graphic";
import { cn } from "@/lib/utils";
import { publicClient } from "@/lib/arkiv";
import ShinyText from "@/components/ui/shiny-text";
import { eq, gt, asc } from "@arkiv-network/sdk/query";
import { useEffect, useState, useCallback, useMemo } from "react";

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

function StatusBadge({ status }: { status?: string }) {
  if (!status || status === "upcoming") return null;
  if (status === "active") {
    return (
      <div className="absolute top-3 right-3">
        <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 border border-green-500/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400 backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live
        </span>
      </div>
    );
  }
  if (status === "past") {
    return (
      <div className="absolute top-3 right-3">
        <span className="flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/40 backdrop-blur">
          Ended
        </span>
      </div>
    );
  }
  if (status === "cancelled") {
    return (
      <div className="absolute top-3 right-3">
        <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-red-400 backdrop-blur">
          Cancelled
        </span>
      </div>
    );
  }
  return null;
}

export function EventsFeed() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<string[]>([]);

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const fetchEvents = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const now = Math.floor(Date.now() / 1000);
      const query = publicClient.buildQuery();
      let result = await query
        .where(eq("type", "event"))
        .where(gt("event_timestamp", now))
        .orderBy(asc("event_timestamp", "number"))
        .withPayload(true)
        .withAttributes(true)
        .limit(20)
        .fetch();
      if (result.entities.length === 0) {
        const fallbackQuery = publicClient.buildQuery();
        result = await fallbackQuery
          .where(eq("type", "event"))
          .orderBy(asc("event_timestamp", "number"))
          .withPayload(true)
          .withAttributes(true)
          .limit(50)
          .fetch();
      }

      // Query actual RSVP counts
      const rsvpQ = publicClient.buildQuery();
      const rsvpResult = await rsvpQ
        .where(eq("type", "rsvp"))
        .withAttributes(true)
        .limit(5000)
        .fetch();
      const rsvpCountByEvent: Record<string, number> = {};
      const normalizeKey = (k: string) => (k.startsWith("0x") ? k : `0x${k}`);
      for (const rsvpEntity of rsvpResult.entities) {
        const eventKey = rsvpEntity.attributes?.find((a) => a.key === "event_key")?.value as string | undefined;
        if (eventKey) {
          const key = normalizeKey(eventKey);
          rsvpCountByEvent[key] = (rsvpCountByEvent[key] ?? 0) + 1;
        }
      }

      const eventList: EventData[] = result.entities
        .map((entity) => {
          const payload = entity.payload ? entity.toJson() : {};
          const attrs = entity.attributes || [];
          const rawTs = attrs.find((a) => a.key === "event_timestamp")?.value;
          const eventTimestamp = typeof rawTs === "number" ? rawTs : typeof rawTs === "string" ? parseInt(rawTs, 10) : 0;
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
        .filter((e) => e.eventTimestamp > now)
        .sort((a, b) => {
          // Live events pinned to top, then ascending by timestamp (already ordered by Arkiv)
          if (a.status === "active" && b.status !== "active") return -1;
          if (b.status === "active" && a.status !== "active") return 1;
          return a.eventTimestamp - b.eventTimestamp;
        })
        .slice(0, 20);

      setEvents(eventList);

      // Extract unique non-empty communities for filter pills
      const uniqueCommunities = Array.from(
        new Set(eventList.map((e) => e.community).filter((c): c is string => !!c && c !== "general"))
      );
      setCommunities(uniqueCommunities);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchEvents(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [fetchEvents]);

  // Client-side filtering
  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (search && !e.title.toLowerCase().includes(search.toLowerCase()) &&
          !e.description.toLowerCase().includes(search.toLowerCase()) &&
          !e.location.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedCommunity && e.community !== selectedCommunity) return false;
      if (selectedStatus) {
        const effectiveStatus = e.status || "upcoming";
        if (effectiveStatus !== selectedStatus) return false;
      } else {
        // Hide cancelled events unless explicitly filtered
        if (e.status === "cancelled") return false;
      }
      return true;
    });
  }, [events, search, selectedCommunity, selectedStatus]);

  const hasFilters = search || selectedCommunity || selectedStatus;

  const Header = (
    <div className="flex flex-col gap-6 mb-10">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/events/my-events"
            className="inline-flex items-center gap-2 -ml-2 px-2 py-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors mb-4"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            <span>My Events</span>
          </Link>
          <h1 id="events-feed-title" className="font-malinton text-4xl md:text-5xl font-black">
            <ShinyText text="Events" color="#FF52A2" shineColor="#ffffff" speed={2.5} spread={150} />
          </h1>
          <p className="text-white/50 mt-2">Discover and RSVP to events on Arkiv</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchEvents()} disabled={loading} className="gap-2 border-white/20 text-white hover:bg-white/10">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild size="sm" id="create-event-btn" className="bg-primary text-black hover:bg-primary/90 font-bold">
            <Link href="/events/create">Create Event</Link>
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div id="events-filters" className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 pr-10 bg-white/5 border-white/10 text-white h-11 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {/* Status filters */}
          {(["upcoming", "active", "past", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(selectedStatus === s ? null : s)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border transition-all",
                selectedStatus === s
                  ? s === "active"
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : s === "cancelled"
                    ? "bg-red-500/20 border-red-500/50 text-red-400"
                    : "bg-primary/20 border-primary/50 text-primary"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"
              )}
            >
              {s === "active" ? "Live" : s === "past" ? "Ended" : s === "cancelled" ? "Cancelled" : "Upcoming"}
            </button>
          ))}

          {/* Community filters */}
          {communities.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCommunity(selectedCommunity === c ? null : c)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold border transition-all",
                selectedCommunity === c
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30"
              )}
            >
              {c}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setSelectedCommunity(null); setSelectedStatus(null); }}
              className="px-3 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white/40 hover:text-white transition-all"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <section id="events" className="w-full">
        {Header}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-[400px] bg-card border-white/10 flex flex-col p-2 rounded-[1.5rem]">
              <div className="relative aspect-[4/3] w-full rounded-[1rem] bg-white/5 mb-4" />
              <div className="flex flex-col flex-1 px-2 pb-2">
                <div className="h-6 w-3/4 rounded bg-white/10 mb-2" />
                <div className="h-4 w-full rounded bg-white/5 mb-2" />
                <div className="h-4 w-5/6 rounded bg-white/5 mb-4" />
                <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-1/3 rounded bg-white/10" />
                    <div className="h-3 w-1/4 rounded bg-white/10" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="w-full">
      {Header}

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-8 py-16 text-center"
        >
          <p className="mb-4 text-white/80">
            {hasFilters ? "No events match your filters." : "No upcoming events yet."}
          </p>
          <p className="mb-6 text-sm text-white/50">
            {hasFilters
              ? "Try adjusting your search or filters."
              : "Only events with a future date/time are shown. If you just created an event, try refreshing."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {hasFilters ? (
              <Button variant="outline" onClick={() => { setSearch(""); setSelectedCommunity(null); setSelectedStatus(null); }} className="border-white/20 text-white hover:bg-white/10">
                Clear filters
              </Button>
            ) : (
              <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
                <Link href="/events/create">Create the first event</Link>
              </Button>
            )}
            <Button onClick={() => fetchEvents()} variant="secondary" className="gap-2 bg-white/10 text-white hover:bg-white/20">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, i) => {
            const dateObj = new Date(event.eventTimestamp * 1000);
            const dayStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;
            const weekdayStr = dateObj.toLocaleDateString("en-US", { weekday: "short" });
            const isFull = event.capacity > 0 && event.currentRsvps >= event.capacity;

            return (
              <motion.div
                key={event.entityKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="h-full"
              >
                <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_30px_-10px_rgba(255,82,162,0.3)] bg-card border-white/10 flex flex-col p-2 rounded-[1.5rem]">
                  <Link href={`/events/${event.entityKey}`} className="flex flex-col h-full">
                    {/* Top Graphic Area */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1rem] bg-muted mb-4">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                          <PatternGraphic
                            seed={event.entityKey}
                            variant={i % 2 === 0 ? "pink" : "beige"}
                          />
                          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                            <div className="flex flex-col drop-shadow-md">
                              <span className={cn("text-4xl font-bold tracking-tighter leading-none", i % 2 === 0 ? "text-white" : "text-black")}>
                                {dayStr}
                              </span>
                              <span className={cn("text-xl font-medium", i % 2 === 0 ? "text-white/80" : "text-black/80")}>
                                {weekdayStr}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <StatusBadge status={event.status} />

                      {/* Community badge */}
                      {event.community && event.community !== "general" && (
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="bg-black/50 backdrop-blur text-white border-white/10">
                            {event.community}
                          </Badge>
                        </div>
                      )}

                      {/* Full badge */}
                      {isFull && (
                        <div className="absolute bottom-3 right-3">
                          <Badge className="bg-red-500/20 border-red-500/40 text-red-400 backdrop-blur">Full</Badge>
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-col flex-1 px-2 pb-2">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-malinton text-xl font-bold text-foreground line-clamp-2 leading-tight">
                          {event.title}
                        </h3>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17l9.2-9.2M17 17V7H7" />
                          </svg>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-1 mb-4">
                        {event.description || "No description"}
                      </p>

                      <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="line-clamp-1 max-w-[120px]">{event.location || "TBA"}</span>
                          </span>
                          <span className={cn("flex items-center gap-1 uppercase", isFull && "text-red-400")}>
                            <Users className="h-3.5 w-3.5" />
                            {event.currentRsvps}/{event.capacity || "∞"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
