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
    async function fetchEvent() {
      if (!entityKey) return;
      try {
        const hexKey = entityKey.startsWith("0x") ? entityKey : `0x${entityKey}`;
        const entity = await publicClient.getEntity(hexKey as `0x${string}`);
        if (!entity) {
          setEvent(null);
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
      } catch {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
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
            <Link href="/">Back to events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isPast = event.eventTimestamp < Math.floor(Date.now() / 1000);

  return (
    <div className="min-h-screen">
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl px-4 pt-24 pb-16"
      >
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-950/50 to-amber-950/30">
                  <Calendar className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h1 className="font-malinton text-3xl font-bold">{event.title}</h1>
                {event.community && (
                  <Badge variant="secondary">{event.community}</Badge>
                )}
                {isPast && <Badge variant="outline">Past</Badge>}
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description || "No description."}</p>
            </div>

            <Card>
              <CardHeader>
                <h2 className="font-semibold">Details</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {new Date(event.eventTimestamp * 1000).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{event.location || "TBA"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>
                    {event.currentRsvps} / {event.capacity || "∞"} RSVPs
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Organizer</h2>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                    <User className="h-5 w-5 text-emerald-500" />
                  </div>
                  <span className="font-medium">{event.organizerName}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {!isPast && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleRsvp}
                  disabled={rsvpLoading}
                >
                  {authenticated ? (rsvpLoading ? "RSVPing..." : "RSVP") : "Connect to RSVP"}
                </Button>
              )}
              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link href={`/events/${entityKey}/checkin`}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Check-in
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full" asChild>
                <Link href={`/events/${entityKey}/attendees`}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Attendees
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
