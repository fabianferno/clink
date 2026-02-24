"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, RefreshCw } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      const result = await query
        .where(eq("type", "event"))
        .where(gt("event_timestamp", now))
        .withPayload(true)
        .withAttributes(true)
        .limit(20)
        .fetch();

      const eventList: EventData[] = result.entities.map((entity) => {
        const payload = entity.payload ? entity.toJson() : {};
        const attrs = entity.attributes || [];
        const eventTimestamp = attrs.find((a) => a.key === "event_timestamp")?.value as number;
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
      });

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
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardHeader>
                  <div className="h-6 w-3/4 rounded bg-muted" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                </CardHeader>
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
            {events.map((event, i) => (
              <motion.div
                key={event.entityKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group overflow-hidden transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5">
                  <Link href={`/events/${event.entityKey}`}>
                    <div className="aspect-video overflow-hidden bg-muted">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-950/50 to-amber-950/30">
                          <Calendar className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-emerald-400">
                          {event.title}
                        </h3>
                        {event.community && (
                          <Badge variant="secondary" className="shrink-0">
                            {event.community}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description || "No description"}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-1">{event.location || "TBA"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>
                          {new Date(event.eventTimestamp * 1000).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4 shrink-0" />
                        <span>
                          {event.currentRsvps} / {event.capacity || "∞"} RSVPs
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" size="sm" className="w-full group-hover:bg-emerald-500/10">
                        View event →
                      </Button>
                    </CardFooter>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
