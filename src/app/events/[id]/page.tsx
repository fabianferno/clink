"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { useWallets } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { PatternGraphic } from "@/components/ui/pattern-graphic";

const QRCode = dynamic(() => import("react-qr-code").then((m) => m.default), { ssr: false });
import { publicClient } from "@/lib/arkiv";
import { createArkivWalletClient } from "@/lib/arkiv-wallet";
import { eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { mendoza } from "@arkiv-network/sdk/chains";
import { Header } from "@/components/header";

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
  organizerAddress: string;
  capacity: number;
  currentRsvps: number;
  eventTimestamp: number;
  community?: string;
  status?: string;
}

// Only rendered inside PrivyProvider (when hasPrivy is true)
function RsvpButton({ eventKey }: { eventKey: string }) {
  const { wallets } = useWallets();
  const { authenticated, login, user } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const walletAddress =
    user?.wallet?.address ??
    (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as { address: string } | undefined)?.address ??
    wallets[0]?.address ??
    "";
  const displayName = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "Anon";

  // Check on mount if user has already RSVPed
  useEffect(() => {
    if (!walletAddress || !eventKey) return;
    let cancelled = false;
    async function checkExistingRsvp() {
      try {
        const existingQ = publicClient.buildQuery();
        const existing = await existingQ
          .where(eq("type", "rsvp"))
          .where(eq("event_key", eventKey))
          .where(eq("attendee", walletAddress))
          .limit(1)
          .fetch();
        if (!cancelled && existing.entities.length > 0) {
          setStatus((prev) => (prev === "success" ? "success" : "already"));
        }
      } catch {
        // Silently ignore — user can still try to RSVP
      }
    }
    checkExistingRsvp();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, eventKey]);

  const handleRsvp = async () => {
    if (!authenticated) {
      login();
      return;
    }

    const wallet = wallets[0];
    if (!wallet) {
      setError("No wallet connected. Please reconnect.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();
      await wallet.switchChain(mendoza.id);
      const wc = createArkivWalletClient(provider, wallet.address as `0x${string}`);
      const now = Math.floor(Date.now() / 1000);

      // Check if already RSVPed
      const existingQ = publicClient.buildQuery();
      const existing = await existingQ
        .where(eq("type", "rsvp"))
        .where(eq("event_key", eventKey))
        .where(eq("attendee", walletAddress))
        .limit(1)
        .fetch();

      if (existing.entities.length > 0) {
        setStatus("already");
        return;
      }

      // Fetch profile for displayName and upsert
      const profileQ = publicClient.buildQuery();
      const profiles = await profileQ
        .where(eq("type", "profile"))
        .where(eq("address", walletAddress))
        .withPayload(true)
        .withAttributes(true)
        .limit(1)
        .fetch();

      let attendeeDisplayName = displayName;
      if (profiles.entities.length > 0) {
        const pd = profiles.entities[0].toJson() as Record<string, unknown>;
        const profileName = pd.displayName as string | undefined;
        if (profileName && profileName.trim()) {
          attendeeDisplayName = profileName.trim();
        }
      }

      // Create RSVP entity
      await wc.createEntity({
        payload: jsonToPayload({
          attendeeAddress: walletAddress,
          attendeeName: attendeeDisplayName,
          eventEntityKey: eventKey,
          rsvpTimestamp: now,
          checkedIn: false,
          checkedInTimestamp: 0,
        }),
        contentType: "application/json",
        attributes: [
          { key: "type", value: "rsvp" },
          { key: "event_key", value: eventKey },
          { key: "attendee", value: walletAddress },
          { key: "rsvp_timestamp", value: now },
          { key: "checked_in", value: "0" },
        ],
        expiresIn: ExpirationTime.fromDays(60),
      });

      // Upsert UserProfile (reuse profiles from above)
      if (profiles.entities.length === 0) {
        // Create new profile
        await wc.createEntity({
          payload: jsonToPayload({
            address: walletAddress,
            displayName,
            bio: "",
            totalRsvps: 1,
            totalCheckins: 0,
            showUpRate: 0,
            currentStreak: 0,
            lastCheckinTimestamp: 0,
          }),
          contentType: "application/json",
          attributes: [
            { key: "type", value: "profile" },
            { key: "address", value: walletAddress },
            { key: "show_up_rate", value: "0" },
            { key: "streak", value: "0" },
            { key: "last_checkin", value: "0" },
            { key: "newcomer", value: 1 },
          ],
          expiresIn: ExpirationTime.fromDays(365),
        });
      } else {
        // Update existing profile
        const profile = profiles.entities[0];
        const pd = profile.toJson() as Record<string, unknown>;
        const totalRsvps = ((pd.totalRsvps as number) || 0) + 1;
        const newcomer = totalRsvps < 3 ? 1 : 0;
        const totalCheckins = (pd.totalCheckins as number) || 0;
        const showUpRate = totalRsvps > 0 ? Math.round((totalCheckins / totalRsvps) * 100) : 0;
        const existingAttrs = profile.attributes || [];

        await wc.updateEntity({
          entityKey: profile.key,
          payload: jsonToPayload({ ...pd, totalRsvps }),
          contentType: "application/json",
          attributes: existingAttrs.map((a) => {
            if (a.key === "newcomer") return { key: "newcomer", value: String(newcomer) };
            if (a.key === "show_up_rate") return { key: "show_up_rate", value: String(showUpRate) };
            return a;
          }),
          expiresIn: ExpirationTime.fromDays(365),
        });
      }

      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "RSVP failed. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <Button
        size="lg"
        className="w-full h-14 text-lg bg-green-500 text-white rounded-full font-bold cursor-default"
        disabled
      >
        ✓ You&apos;re on the list!
      </Button>
    );
  }

  if (status === "already") {
    return (
      <Button
        size="lg"
        className="w-full h-14 text-lg rounded-full font-bold cursor-default"
        disabled
      >
        ✓ Already RSVPed
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      <Button
        size="lg"
        className="w-full h-14 text-lg bg-white text-black hover:bg-white/90 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        onClick={handleRsvp}
        disabled={status === "loading"}
      >
        {status === "loading"
          ? "RSVPing..."
          : authenticated
            ? "RSVP Now"
            : "Connect to RSVP"}
      </Button>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { wallets } = useWallets();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTicket, setShowTicket] = useState(false);
  const [checkinCode, setCheckinCode] = useState<string | null>(null);

  const entityKey = params.id as string;

  useEffect(() => {
    if (!showTicket || !entityKey) return;
    let cancelled = false;
    async function fetchCheckinCode() {
      try {
        const codeQ = publicClient.buildQuery();
        const result = await codeQ
          .where(eq("type", "checkin_code"))
          .where(eq("event_key", entityKey))
          .withPayload(true)
          .limit(1)
          .fetch();
        if (!cancelled && result.entities.length > 0) {
          const payload = result.entities[0].toJson() as Record<string, unknown>;
          setCheckinCode((payload.code as string) || null);
        } else {
          setCheckinCode(null);
        }
      } catch {
        if (!cancelled) setCheckinCode(null);
      }
    }
    fetchCheckinCode();
    return () => {
      cancelled = true;
    };
  }, [showTicket, entityKey]);

  const walletAddress =
    user?.wallet?.address ??
    (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as { address: string } | undefined)
      ?.address ??
    wallets[0]?.address ??
    "";
  const isOrganizer =
    event &&
    event.organizerAddress &&
    walletAddress &&
    event.organizerAddress.toLowerCase() === walletAddress.toLowerCase();

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
        // Query actual RSVP count (event payload.currentRsvps is never updated)
        const rsvpCountQ = publicClient.buildQuery();
        const rsvpCountResult = await rsvpCountQ
          .where(eq("type", "rsvp"))
          .where(eq("event_key", entityKey))
          .limit(1000)
          .fetch();
        const currentRsvps = rsvpCountResult.entities.length;
        setEvent({
          entityKey: entity.key,
          title: (payload?.title as string) || "Untitled Event",
          description: (payload?.description as string) || "",
          location: (payload?.location as string) || "",
          imageUrl: payload?.imageUrl as string | undefined,
          organizerName: (payload?.organizerName as string) || "Anonymous",
          organizerAddress: (payload?.organizerAddress as string) || "",
          capacity: (payload?.capacity as number) || 0,
          currentRsvps,
          eventTimestamp:
            (attrs.find((a) => a.key === "event_timestamp")?.value as number) || 0,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black overflow-hidden flex flex-col">
        <Header />
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-28 pb-12">
          <div className="grid md:grid-cols-[1fr_400px] gap-8 relative">
            <div className="flex flex-col gap-6 w-full animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="w-full aspect-[21/9] rounded-3xl bg-white/10" />
              <div className="mt-4 space-y-4">
                <div className="h-12 w-3/4 bg-white/10 rounded-xl" />
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-white/10 rounded" />
                    <div className="h-4 w-32 bg-white/10 rounded" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 w-40 bg-white/10 rounded" />
                  <div className="h-4 w-full bg-white/10 rounded" />
                  <div className="h-4 w-5/6 bg-white/10 rounded" />
                  <div className="h-4 w-4/6 bg-white/10 rounded" />
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="sticky top-28 bg-[#141414] rounded-3xl border border-white/5 p-6 space-y-6 animate-pulse">
                <div className="space-y-6 flex flex-col pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10" />
                      <div className="space-y-2 flex-1 pt-1">
                        <div className="h-4 w-1/2 bg-white/10 rounded" />
                        <div className="h-3 w-1/3 bg-white/10 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="w-full h-14 bg-white/10 rounded-full" />
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-white/10 rounded-full" />
                    <div className="flex-1 h-10 bg-white/10 rounded-full" />
                  </div>
                  <div className="w-full h-12 bg-white/10 rounded-full mt-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-7xl px-4 pt-32 text-center">
          <h1 className="font-malinton mb-4 text-2xl font-bold">Event not found</h1>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 -ml-2 px-2 py-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            <span>Back to Events</span>
          </Link>
        </div>
      </div>
    );
  }

  const isPast = event.eventTimestamp < Math.floor(Date.now() / 1000);
  const dateObj = new Date(event.eventTimestamp * 1000);
  const dayStr = dateObj
    .toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" })
    .replace("/", ".");
  const yearStr = dateObj.getFullYear().toString();
  const timeStr = dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col">
      <Header />


      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full max-w-7xl mx-auto px-4 pt-28 pb-12"
      >
        <div className="grid md:grid-cols-[1fr_400px] gap-8 relative">
          {/* Left Column: Details */}
          <div className="flex flex-col gap-6">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 -ml-2 px-2 py-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              <span>Back to Events</span>
            </Link>

            <div className="w-full aspect-[21/9] rounded-3xl overflow-hidden relative bg-[#141414] border border-white/10 shadow-2xl">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PatternGraphic seed={event.entityKey} variant="pink" />
              )}
            </div>

            <div className="mt-4">
              <h1 className="font-malinton text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
                {event.title}
              </h1>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex flex-shrink-0" />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider">Organized by</p>
                  <p className="text-white font-medium">{event.organizerName}</p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-bold text-white mb-2">About this event</h3>
                <p className="text-white/70 leading-relaxed whitespace-pre-wrap text-lg">
                  {event.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Action Card */}
          <div className="relative">
            <div className="sticky top-28 bg-[#141414] rounded-3xl border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  <div>
                    <p className="text-white font-bold">{dayStr} {yearStr}</p>
                    <p className="text-white/50 text-sm">{timeStr}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  </div>
                  <div>
                    <p className="text-white font-bold">{event.location || "Location TBA"}</p>
                    {event.community && <p className="text-white/50 text-sm">{event.community}</p>}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <div>
                    <p className="text-white font-bold">{event.currentRsvps} / {event.capacity || "∞"} RSVPs</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                {!isPast &&
                  (hasPrivy ? (
                    <RsvpButton eventKey={entityKey} />
                  ) : (
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg bg-white text-black hover:bg-white/90 rounded-full font-bold opacity-50"
                      disabled
                    >
                      RSVP (wallet not configured)
                    </Button>
                  ))}

                {isOrganizer && (
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/80">Organizer</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" className="rounded-full bg-primary text-black hover:bg-primary/90 font-bold" asChild>
                        <Link href={`/events/${entityKey}/edit`}>Edit event</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full border-white/20 text-white hover:bg-white/10" asChild>
                        <Link href={`/events/${entityKey}/checkin`}>Check-in</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full border-white/20 text-white hover:bg-white/10" asChild>
                        <Link href={`/events/${entityKey}/attendees`}>Attendees</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-full border-white/20 text-white hover:bg-white/10" asChild>
                        <Link href="/events/my-events">My Events</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {!isOrganizer && (
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-full border-white/20 text-white hover:bg-white/10 font-medium" asChild>
                      <Link href={`/events/${entityKey}/checkin`}>Check-in</Link>
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-full border-white/20 text-white hover:bg-white/10 font-medium" asChild>
                      <Link href={`/events/${entityKey}/attendees`}>Attendees</Link>
                    </Button>
                  </div>
                )}

                <Button
                  onClick={() => setShowTicket(true)}
                  className="w-full h-12 bg-white/5 text-white hover:bg-white/10 rounded-full font-medium mt-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect x="3" y="10" width="18" height="10" rx="2" ry="2" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="14" x2="21" y2="14" /></svg>
                  Display Ticket
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ticket Modal */}
      {showTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTicket(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md z-10"
          >
            <button
              onClick={() => setShowTicket(false)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all font-bold"
            >
              ✕
            </button>
            <div className="bg-[#141414] rounded-[2rem] w-full flex flex-col relative border border-white/5 shadow-2xl overflow-hidden min-h-[600px]">
              {/* Top Graphic Area */}
              <div className="p-4 w-full aspect-4/3">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative bg-muted" style={{ aspectRatio: "4/3" }}>
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PatternGraphic seed={event.entityKey} variant="pink" />
                  )}
                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <span className="text-white font-bold text-lg">
                      {dayStr}{" "}
                      <span className="font-normal opacity-80">{yearStr}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Info Area */}
              <div className="px-8 pb-4">
                <h2 className="font-malinton text-4xl font-bold text-white leading-tight mb-2">
                  {event.title}
                </h2>
                <p className="text-white/60 text-sm mb-8 line-clamp-2">
                  {event.community ? `${event.community} • ` : ""}
                  {event.location || "Location TBA"}
                </p>

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
                    <p className="text-white font-bold text-lg">
                      {event.currentRsvps} <span className="text-sm font-normal text-white/50">/ {event.capacity || "∞"}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Organizer</p>
                    <p className="text-white font-bold text-lg truncate">{event.organizerName}</p>
                  </div>
                </div>

                {checkinCode && (
                  <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Check-in at event</p>
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-2 rounded-lg shrink-0">
                        <QRCode
                          value={
                            typeof window !== "undefined"
                              ? `${window.location.origin}/events/${entityKey}/checkin?c=${checkinCode}`
                              : checkinCode
                          }
                          size={80}
                          level="M"
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xl font-bold tracking-widest text-white mb-1">{checkinCode}</p>
                        <Button asChild size="sm" className="mt-2 bg-primary text-black hover:bg-primary/90 font-bold">
                          <Link href={`/events/${entityKey}/checkin?c=${checkinCode}`}>
                            Go to Check-in
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {!checkinCode && !isPast && (
                  <div className="mb-8">
                    <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                      <Link href={`/events/${entityKey}/checkin`}>Go to Check-in</Link>
                    </Button>
                    <p className="text-white/40 text-xs mt-2">Check-in code will be available when the organizer publishes it.</p>
                  </div>
                )}
              </div>

              {/* Ticket Dotted Separator */}
              <div className="w-full relative py-2">
                <div className="absolute w-8 h-8 rounded-full bg-black/80 -left-4 top-1/2 -translate-y-1/2 z-10" />
                <div className="w-full border-t-[3px] border-dashed border-white/10" />
                <div className="absolute w-8 h-8 rounded-full bg-black/80 -right-4 top-1/2 -translate-y-1/2 z-10" />
              </div>

              {/* Visual Barcode */}
              <div className="p-8 mt-auto flex object-bottom">
                <div className="w-full pt-4 border-t border-white/10 flex items-center justify-between text-white/30">
                  <span className="font-mono text-xs tracking-widest">
                    {entityKey.slice(0, 12)}...
                  </span>
                  <svg width="100" height="24" viewBox="0 0 100 24" fill="currentColor">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <rect
                        key={i}
                        x={i * 3 + (Math.random() * 2)}
                        y="0"
                        width={Math.random() > 0.5 ? 2 : 1}
                        height="24"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
