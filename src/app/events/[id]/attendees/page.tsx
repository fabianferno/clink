"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Link2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { useAuth } from "@/components/providers";
import { useWallets } from "@privy-io/react-auth";
import { publicClient } from "@/lib/arkiv";
import { createArkivWalletClient } from "@/lib/arkiv-wallet";
import { eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { mendoza } from "@arkiv-network/sdk/chains";

const hasPrivy =
  typeof process.env.NEXT_PUBLIC_PRIVY_APP_ID === "string" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "placeholder" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID.length >= 10;

interface AttendeeData {
  rsvpEntityKey: string;
  attendeeAddress: string;
  attendeeName: string;
  checkinTimestamp: number;
  showUpRate: number | null; // null = newcomer
  streak: number;
  isNewcomer: boolean;
}

function scoreColor(rate: number | null, isNewcomer: boolean) {
  if (isNewcomer || rate === null) return "bg-white/10 text-white/60";
  if (rate >= 80) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (rate >= 50) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

function scoreLabel(rate: number | null, isNewcomer: boolean) {
  if (isNewcomer || rate === null) return "New";
  return `${rate}%`;
}

// ClinkButton — only mounted inside PrivyProvider
function ClinkButton({
  myAddress,
  targetAddress,
  eventKey,
  eventTitle,
}: {
  myAddress: string;
  targetAddress: string;
  eventKey: string;
  eventTitle: string;
}) {
  const { wallets } = useWallets();
  const { authenticated, login } = useAuth();
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (myAddress.toLowerCase() === targetAddress.toLowerCase()) return null;

  const handleClink = async () => {
    if (!authenticated) { login(); return; }
    const wallet = wallets[0];
    if (!wallet) { setError("No wallet."); return; }

    setStatus("loading");
    setError(null);

    try {
      const provider = await wallet.getEthereumProvider();
      await wallet.switchChain(mendoza.id);
      const wc = createArkivWalletClient(provider, wallet.address as `0x${string}`);
      const now = Math.floor(Date.now() / 1000);

      // Check for existing clink
      const existingQ = publicClient.buildQuery();
      const existing = await existingQ
        .where(eq("type", "clink"))
        .where(eq("initiator", myAddress))
        .where(eq("receiver", targetAddress))
        .where(eq("event_key", eventKey))
        .limit(1)
        .fetch();

      if (existing.entities.length > 0) {
        setStatus("sent");
        return;
      }

      await wc.createEntity({
        payload: jsonToPayload({
          initiator: myAddress,
          receiver: targetAddress,
          eventEntityKey: eventKey,
          eventTitle,
          status: "pending",
          message: "",
          timestamp: now,
        }),
        contentType: "application/json",
        attributes: [
          { key: "type", value: "clink" },
          { key: "initiator", value: myAddress },
          { key: "receiver", value: targetAddress },
          { key: "event_key", value: eventKey },
          { key: "status", value: "pending" },
          { key: "clink_timestamp", value: now },
        ],
        expiresIn: ExpirationTime.fromDays(365),
      });

      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send Clink");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <span className="text-xs text-green-400 font-bold">Clink sent ✓</span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button
        size="sm"
        variant="outline"
        className="gap-1 h-8 text-xs border-white/20 text-white hover:bg-white/10"
        onClick={handleClink}
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Link2 className="h-3 w-3" />
        )}
        Clink
      </Button>
    </div>
  );
}

export default function AttendeesPage() {
  const params = useParams();
  const { user } = useAuth();
  const entityKey = params.id as string;
  const [attendees, setAttendees] = useState<AttendeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState("Event");

  const myAddress =
    user?.wallet?.address ??
    (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as
      | { address: string }
      | undefined)?.address ??
    "";

  useEffect(() => {
    async function fetchData() {
      if (!entityKey) return;
      setLoading(true);

      try {
        // Fetch event title
        const hexKey = entityKey.startsWith("0x") ? entityKey : `0x${entityKey}`;
        const eventEntity = await publicClient.getEntity(hexKey as `0x${string}`);
        if (eventEntity?.payload) {
          const ep = eventEntity.toJson() as Record<string, unknown>;
          setEventTitle((ep.title as string) || "Event");
        }

        // Fetch checked-in RSVPs
        const rsvpQ = publicClient.buildQuery();
        const rsvpResult = await rsvpQ
          .where(eq("type", "rsvp"))
          .where(eq("event_key", entityKey))
          .where(eq("checked_in", 1))
          .withPayload(true)
          .withAttributes(true)
          .limit(100)
          .fetch();

        if (rsvpResult.entities.length === 0) {
          setAttendees([]);
          setLoading(false);
          return;
        }

        // Fetch profile for each attendee (in parallel)
        const attendeeList: AttendeeData[] = await Promise.all(
          rsvpResult.entities.map(async (rsvp) => {
            const rsvpPayload = rsvp.toJson() as Record<string, unknown>;
            const address = (rsvpPayload.attendeeAddress as string) || "";
            const name = (rsvpPayload.attendeeName as string) || `${address.slice(0, 6)}...${address.slice(-4)}`;
            const checkinTs = (rsvpPayload.checkedInTimestamp as number) || 0;

            // Fetch profile for score
            let showUpRate: number | null = null;
            let streak = 0;
            let isNewcomer = true;

            if (address) {
              try {
                const profileQ = publicClient.buildQuery();
                const profileResult = await profileQ
                  .where(eq("type", "profile"))
                  .where(eq("address", address))
                  .withPayload(true)
                  .withAttributes(true)
                  .limit(1)
                  .fetch();

                if (profileResult.entities.length > 0) {
                  const profile = profileResult.entities[0];
                  const pd = profile.toJson() as Record<string, unknown>;
                  const attrs = profile.attributes || [];
                  const newcomerAttr = attrs.find((a) => a.key === "newcomer");
                  isNewcomer = newcomerAttr ? Number(newcomerAttr.value) === 1 : true;
                  showUpRate = isNewcomer ? null : Math.round(((pd.showUpRate as number) || 0) * 100);
                  streak = (pd.currentStreak as number) || 0;
                }
              } catch {
                // ignore — show newcomer badge
              }
            }

            return {
              rsvpEntityKey: rsvp.key,
              attendeeAddress: address,
              attendeeName: name,
              checkinTimestamp: checkinTs,
              showUpRate,
              streak,
              isNewcomer,
            };
          })
        );

        setAttendees(attendeeList);
      } catch (err) {
        console.error("Failed to fetch attendees:", err);
        setAttendees([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [entityKey]);

  return (
    <div className="min-h-screen">
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl px-4 pt-24 pb-16"
      >
        <Link
          href={`/events/${entityKey}`}
          className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to event
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[#141414] overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h1 className="font-malinton text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Checked-in Attendees
            </h1>
            <p className="text-muted-foreground text-sm">
              {!loading && `${attendees.length} ${attendees.length === 1 ? "person" : "people"} checked in`}
            </p>
          </div>

          {loading ? (
            <ul className="divide-y divide-white/5">
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className="flex items-center justify-between gap-4 px-6 py-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-white/10 rounded" />
                      <div className="h-3 w-16 bg-white/10 rounded" />
                    </div>
                  </div>
                  <div className="h-8 w-16 bg-white/10 rounded" />
                </li>
              ))}
            </ul>
          ) : attendees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">No one has checked in yet.</p>
              <p className="mt-2 text-sm text-muted-foreground/60">
                Once attendees check in, they&apos;ll appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {attendees.map((attendee) => (
                <li
                  key={attendee.rsvpEntityKey}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar placeholder */}
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 font-mono text-xs font-bold text-white/60">
                      {attendee.attendeeName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{attendee.attendeeName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          className={`text-[10px] px-2 py-0 border ${scoreColor(attendee.showUpRate, attendee.isNewcomer)}`}
                        >
                          {scoreLabel(attendee.showUpRate, attendee.isNewcomer)}
                        </Badge>
                        {attendee.streak > 0 && (
                          <span className="text-xs text-white/40">
                            🔥 {attendee.streak} streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {hasPrivy && myAddress ? (
                    <ClinkButton
                      myAddress={myAddress}
                      targetAddress={attendee.attendeeAddress}
                      eventKey={entityKey}
                      eventTitle={eventTitle}
                    />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-8 text-xs border-white/20 text-white/40"
                      disabled
                    >
                      <Link2 className="h-3 w-3" />
                      Clink
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
