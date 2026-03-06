"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, RefreshCw } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PatternGraphic } from "@/components/ui/pattern-graphic";
import { cn } from "@/lib/utils";
import { publicClient } from "@/lib/arkiv";
import { eq, gt } from "@arkiv-network/sdk/query";
import { useEffect, useState, useCallback } from "react";

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
}

export function EventsFeed() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const now = Math.floor(Date.now() / 1000);
      const query = publicClient.buildQuery();
      let result = await query
        .where(eq("type", "event"))
        .where(gt("event_timestamp", now))
        .withPayload(true)
        .withAttributes(true)
        .limit(20)
        .fetch();
      if (result.entities.length === 0) {
        const fallbackQuery = publicClient.buildQuery();
        result = await fallbackQuery
          .where(eq("type", "event"))
          .withPayload(true)
          .withAttributes(true)
          .limit(50)
          .fetch();
      }

      const eventList: EventData[] = result.entities
        .map((entity) => {
          const payload = entity.payload ? entity.toJson() : {};
          const attrs = entity.attributes || [];
          const rawTs = attrs.find((a) => a.key === "event_timestamp")?.value;
          const eventTimestamp = typeof rawTs === "number" ? rawTs : typeof rawTs === "string" ? parseInt(rawTs, 10) : 0;
          return {
            entityKey: entity.key,
            title: (payload?.title as string) || "Untitled Event",
            description: (payload?.description as string) || "",
            location: (payload?.location as string) || "",
            imageUrl: payload?.imageUrl as string | undefined,
            organizerName: (payload?.organizerName as string) || "Anonymous",
            capacity: (payload?.capacity as number) || 0,
            currentRsvps: (payload?.currentRsvps as number) || 0,
            eventTimestamp: eventTimestamp || 0,
            community: attrs.find((a) => a.key === "community")?.value as string | undefined,
          };
        })
        .filter((e) => e.eventTimestamp > now)
        .sort((a, b) => a.eventTimestamp - b.eventTimestamp)
        .slice(0, 20);

      setEvents(eventList);
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

  // Refetch when user returns to tab (e.g. after creating event or switching back)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchEvents(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [fetchEvents]);

  if (loading) {
    return (
      <section id="events" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-malinton text-center text-3xl font-bold text-foreground sm:text-left"
            >
              Upcoming events
            </motion.h2>
            <Button variant="outline" size="sm" disabled className="gap-2 shrink-0">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Refresh
            </Button>
          </div>
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
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-malinton text-center text-3xl font-bold text-foreground sm:text-left"
          >
            Upcoming events
          </motion.h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEvents()}
            disabled={loading}
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 px-8 py-16 text-center"
          >
            <p className="mb-4 text-muted-foreground">No upcoming events yet.</p>
            <p className="mb-6 text-sm text-muted-foreground/80">
              Only events with a future date/time are shown. If you just created an event, try refreshing or check that the event date is in the future.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/events/create">Create the first event</Link>
              </Button>
              <Button onClick={() => fetchEvents()} variant="secondary" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => {
              const dateObj = new Date(event.eventTimestamp * 1000);
              const dayStr = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`;
              const weekdayStr = dateObj.toLocaleDateString("en-US", { weekday: "short" });

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
                            {/* Overlay large date on the pattern */}
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

                        {/* Always show community badge if present, floating */}
                        {event.community && (
                          <div className="absolute bottom-3 left-3">
                            <Badge variant="secondary" className="bg-black/50 backdrop-blur text-white border-white/10">
                              {event.community}
                            </Badge>
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
                            <span className="flex items-center gap-1 uppercase">
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
      </div>
    </section>
  );
}
