"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";

const QRCode = dynamic(() => import("react-qr-code").then((m) => m.default), { ssr: false });
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

function generateCheckinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface EventInfo {
  title: string;
  eventTimestamp: number;
  community: string;
  organizerAddress: string;
}

export default function CheckinPage() {
  if (!hasPrivy) return <CheckinPageNoWallet />;
  return <CheckinPageFull />;
}

function CheckinPageNoWallet() {
  const params = useParams();
  const entityKey = params.id as string;
  const [code] = useState(generateCheckinCode());

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-16">
        <Link
          href={`/events/${entityKey}`}
          className="mb-8 inline-flex items-center gap-2 -ml-2 px-2 py-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          <span>Back to event</span>
        </Link>
        <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/10 p-8 text-center">
          <p className="text-muted-foreground mb-2">Check-in code (display only)</p>
          <p className="font-mono text-4xl font-bold tracking-widest">{code}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Wallet not configured — code is not stored to Arkiv.
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckinPageFull() {
  const params = useParams();
  const { authenticated, login, user } = useAuth();
  const { wallets } = useWallets();
  const [mode, setMode] = useState<"organizer" | "attendee">("organizer");
  const [code] = useState(generateCheckinCode());
  const [copied, setCopied] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [publishError, setPublishError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const [attendeeCode, setAttendeeCode] = useState("");
  useEffect(() => {
    const c = searchParams.get("c");
    if (c) setAttendeeCode(c.toUpperCase().slice(0, 6));
  }, [searchParams]);
  const [checkinStatus, setCheckinStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [checkinError, setCheckinError] = useState<string | null>(null);

  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);

  const entityKey = params.id as string;

  // Fetch event info for AttendanceProof creation
  useEffect(() => {
    async function fetchEvent() {
      if (!entityKey) return;
      try {
        const hexKey = entityKey.startsWith("0x") ? entityKey : `0x${entityKey}`;
        const entity = await publicClient.getEntity(hexKey as `0x${string}`);
        if (!entity) return;
        const payload = entity.payload ? entity.toJson() : {};
        const attrs = entity.attributes || [];
        setEventInfo({
          title: (payload?.title as string) || "Untitled Event",
          eventTimestamp: (attrs.find((a) => a.key === "event_timestamp")?.value as number) || 0,
          community: (attrs.find((a) => a.key === "community")?.value as string) || "general",
          organizerAddress: (payload?.organizerAddress as string) || "",
        });
      } catch {
        // non-critical — attendance proof will use fallback values
      }
    }
    fetchEvent();
  }, [entityKey]);

  const walletAddress =
    user?.wallet?.address ??
    (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as
      | { address: string }
      | undefined)?.address ??
    wallets[0]?.address ??
    "";
  const displayName = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "Anon";

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOrganizer =
    eventInfo?.organizerAddress &&
    walletAddress &&
    eventInfo.organizerAddress.toLowerCase() === walletAddress.toLowerCase();

  const now = Math.floor(Date.now() / 1000);
  const CHECKIN_OPENS_BEFORE = 15 * 60; // 15 min before event
  const CHECKIN_CLOSES_AFTER = 60 * 60; // 1 hour after event start
  const canPublish =
    eventInfo &&
    now >= eventInfo.eventTimestamp - CHECKIN_OPENS_BEFORE &&
    now <= eventInfo.eventTimestamp + CHECKIN_CLOSES_AFTER;
  const publishTooEarly = eventInfo && now < eventInfo.eventTimestamp - CHECKIN_OPENS_BEFORE;
  const publishTooLate = eventInfo && now > eventInfo.eventTimestamp + CHECKIN_CLOSES_AFTER;

  // Default to attendee mode when not organizer
  useEffect(() => {
    if (eventInfo && !isOrganizer && mode === "organizer") {
      setMode("attendee");
    }
  }, [eventInfo, isOrganizer, mode]);

  // Organizer: publish check-in code to Arkiv
  const handlePublishCode = async () => {
    if (!authenticated) { login(); return; }
    const wallet = wallets[0];
    if (!wallet) { setPublishError("No wallet connected."); return; }
    if (!isOrganizer) {
      setPublishError("Only the event organizer can publish the check-in code.");
      setPublishStatus("error");
      return;
    }
    if (!canPublish) {
      setPublishError(
        publishTooEarly
          ? "Check-in opens 15 minutes before the event."
          : "Check-in window has closed (1 hour after event start)."
      );
      setPublishStatus("error");
      return;
    }

    setPublishStatus("loading");
    setPublishError(null);

    try {
      const provider = await wallet.getEthereumProvider();
      await wallet.switchChain(mendoza.id);
      const wc = createArkivWalletClient(provider, wallet.address as `0x${string}`);

      await wc.createEntity({
        payload: jsonToPayload({
          code,
          eventKey: entityKey,
          createdAt: Math.floor(Date.now() / 1000),
        }),
        contentType: "application/json",
        attributes: [
          { key: "type", value: "checkin_code" },
          { key: "event_key", value: entityKey },
          { key: "code", value: code },
        ],
        expiresIn: Math.max(
          3600,
          eventInfo.eventTimestamp + CHECKIN_CLOSES_AFTER - now
        ),
      });

      setPublishStatus("done");
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Failed to publish code");
      setPublishStatus("error");
    }
  };

  // Attendee: verify code and check in
  const handleCheckin = async () => {
    if (!authenticated) { login(); return; }
    const wallet = wallets[0];
    if (!wallet) { setCheckinError("No wallet connected."); return; }
    if (attendeeCode.length !== 6) return;

    setCheckinStatus("loading");
    setCheckinError(null);

    try {
      const provider = await wallet.getEthereumProvider();
      await wallet.switchChain(mendoza.id);
      const wc = createArkivWalletClient(provider, wallet.address as `0x${string}`);
      const now = Math.floor(Date.now() / 1000);

      // 1. Verify check-in code exists in Arkiv
      const codeQ = publicClient.buildQuery();
      const codeResult = await codeQ
        .where(eq("type", "checkin_code"))
        .where(eq("event_key", entityKey))
        .where(eq("code", attendeeCode))
        .limit(1)
        .fetch();

      if (codeResult.entities.length === 0) {
        setCheckinError("Invalid or expired check-in code. Ask the organizer to publish a fresh code.");
        setCheckinStatus("error");
        return;
      }

      // 2. Find attendee's RSVP entity (if exists)
      const rsvpQ = publicClient.buildQuery();
      const rsvpResult = await rsvpQ
        .where(eq("type", "rsvp"))
        .where(eq("event_key", entityKey))
        .where(eq("attendee", walletAddress))
        .withPayload(true)
        .withAttributes(true)
        .limit(1)
        .fetch();

      if (rsvpResult.entities.length > 0) {
        // Update existing RSVP to checked_in: 1
        const rsvpEntity = rsvpResult.entities[0];
        const rsvpPayload = rsvpEntity.toJson() as Record<string, unknown>;
        const rsvpAttrs = rsvpEntity.attributes || [];

        // Refresh attendeeName from profile if user has a custom name
        const updatedPayload: Record<string, unknown> = { ...rsvpPayload, checkedIn: true, checkedInTimestamp: now };
        const profileQForUpdate = publicClient.buildQuery();
        const profilesForUpdate = await profileQForUpdate
          .where(eq("type", "profile"))
          .where(eq("address", walletAddress))
          .withPayload(true)
          .limit(1)
          .fetch();
        if (profilesForUpdate.entities.length > 0) {
          const pd = profilesForUpdate.entities[0].toJson() as Record<string, unknown>;
          const profileName = pd.displayName as string | undefined;
          if (profileName && profileName.trim()) {
            updatedPayload.attendeeName = profileName.trim();
          }
        }

        await wc.updateEntity({
          entityKey: rsvpEntity.key,
          payload: jsonToPayload(updatedPayload),
          contentType: "application/json",
          attributes: rsvpAttrs.map((a) =>
            a.key === "checked_in" ? { key: "checked_in", value: "1" } : a
          ),
          expiresIn: ExpirationTime.fromDays(60),
        });
      } else {
        // Walk-in: create RSVP entity with checked_in: 1 directly
        // Prefer profile displayName if user has a profile with a custom name
        let attendeeDisplayName = displayName;
        const profileQForName = publicClient.buildQuery();
        const profilesForName = await profileQForName
          .where(eq("type", "profile"))
          .where(eq("address", walletAddress))
          .withPayload(true)
          .limit(1)
          .fetch();
        if (profilesForName.entities.length > 0) {
          const pd = profilesForName.entities[0].toJson() as Record<string, unknown>;
          const profileName = pd.displayName as string | undefined;
          if (profileName && profileName.trim()) {
            attendeeDisplayName = profileName.trim();
          }
        }

        await wc.createEntity({
          payload: jsonToPayload({
            attendeeAddress: walletAddress,
            attendeeName: attendeeDisplayName,
            eventEntityKey: entityKey,
            rsvpTimestamp: now,
            checkedIn: true,
            checkedInTimestamp: now,
          }),
          contentType: "application/json",
          attributes: [
            { key: "type", value: "rsvp" },
            { key: "event_key", value: entityKey },
            { key: "attendee", value: walletAddress },
            { key: "rsvp_timestamp", value: now },
            { key: "checked_in", value: "1" },
          ],
          expiresIn: ExpirationTime.fromDays(60),
        });
      }

      // 3. Create AttendanceProof entity
      await wc.createEntity({
        payload: jsonToPayload({
          attendeeAddress: walletAddress,
          eventEntityKey: entityKey,
          eventTitle: eventInfo?.title ?? "Event",
          eventDate: eventInfo?.eventTimestamp ?? now,
          community: eventInfo?.community ?? "general",
          checkinTimestamp: now,
        }),
        contentType: "application/json",
        attributes: [
          { key: "type", value: "attendance" },
          { key: "attendee", value: walletAddress },
          { key: "community", value: eventInfo?.community ?? "general" },
          { key: "event_date", value: eventInfo?.eventTimestamp ?? now },
        ],
        expiresIn: ExpirationTime.fromDays(365),
      });

      // 4. Upsert UserProfile
      const profileQ = publicClient.buildQuery();
      const profiles = await profileQ
        .where(eq("type", "profile"))
        .where(eq("address", walletAddress))
        .withPayload(true)
        .withAttributes(true)
        .limit(1)
        .fetch();

      if (profiles.entities.length === 0) {
        await wc.createEntity({
          payload: jsonToPayload({
            address: walletAddress,
            displayName,
            bio: "",
            totalRsvps: 1,
            totalCheckins: 1,
            showUpRate: 100,
            currentStreak: 1,
            lastCheckinTimestamp: now,
          }),
          contentType: "application/json",
          attributes: [
            { key: "type", value: "profile" },
            { key: "address", value: walletAddress },
            { key: "show_up_rate", value: 100 },
            { key: "streak", value: 1 },
            { key: "last_checkin", value: now },
            { key: "newcomer", value: 1 },
          ],
          expiresIn: ExpirationTime.fromDays(365),
        });
      } else {
        const profile = profiles.entities[0];
        const pd = profile.toJson() as Record<string, unknown>;
        const totalRsvps = (pd.totalRsvps as number) || 1;
        const totalCheckins = ((pd.totalCheckins as number) || 0) + 1;
        const showUpRate = Math.round((totalCheckins / totalRsvps) * 100);
        const streak = ((pd.currentStreak as number) || 0) + 1;
        const newcomer = totalRsvps < 3 ? 1 : 0;
        const existingAttrs = profile.attributes || [];

        await wc.updateEntity({
          entityKey: profile.key,
          payload: jsonToPayload({
            ...pd,
            totalCheckins,
            showUpRate: showUpRate / 100,
            currentStreak: streak,
            lastCheckinTimestamp: now,
          }),
          contentType: "application/json",
          attributes: existingAttrs.map((a) => {
            if (a.key === "show_up_rate") return { key: "show_up_rate", value: String(showUpRate) };
            if (a.key === "streak") return { key: "streak", value: String(streak) };
            if (a.key === "last_checkin") return { key: "last_checkin", value: String(now) };
            if (a.key === "newcomer") return { key: "newcomer", value: String(newcomer) };
            return a;
          }),
          expiresIn: ExpirationTime.fromDays(365),
        });
      }

      setCheckinStatus("success");
    } catch (err) {
      setCheckinError(err instanceof Error ? err.message : "Check-in failed. Please try again.");
      setCheckinStatus("error");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-7xl px-4 pt-24 pb-16"
      >
        <Link
          href={`/events/${entityKey}`}
          className="mb-8 inline-flex items-center gap-2 -ml-2 px-2 py-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          <span>Back to event</span>
        </Link>

        {isOrganizer && (
          <div className="mb-8 flex gap-2">
            <Button
              variant={mode === "organizer" ? "default" : "outline"}
              onClick={() => setMode("organizer")}
            >
              Organizer
            </Button>
            <Button
              variant={mode === "attendee" ? "default" : "outline"}
              onClick={() => setMode("attendee")}
            >
              Attendee
            </Button>
          </div>
        )}

        {mode === "organizer" && isOrganizer ? (
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-8 space-y-6">
            <div>
              <h1 className="font-malinton text-2xl font-bold mb-1">Check-in code</h1>
              <p className="text-muted-foreground text-sm">
                Publish this code to Arkiv, then share the QR or code with attendees. Check-in opens 15 min before the event and closes 1 hour after start.
              </p>
            </div>

            {publishTooEarly && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-200 text-sm">
                Check-in opens 15 minutes before the event. Come back closer to start time.
              </div>
            )}
            {publishTooLate && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-200 text-sm">
                Check-in window has closed (1 hour after event start).
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 rounded-xl bg-white/5 p-8">
              <div className="bg-white p-4 rounded-xl shrink-0">
                <QRCode
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/events/${entityKey}/checkin?c=${code}`
                      : code
                  }
                  size={180}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="flex flex-col items-center sm:items-start gap-2">
                <span className="font-mono text-4xl font-bold tracking-widest text-white">{code}</span>
                <p className="text-white/50 text-sm">Scan QR or enter code manually</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={copyCode}>
                {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy</>}
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handlePublishCode}
                disabled={publishStatus === "loading" || publishStatus === "done" || !canPublish}
              >
                {publishStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                {publishStatus === "done" ? "✓ Published to Arkiv" : publishStatus === "loading" ? "Publishing..." : "Publish to Arkiv"}
              </Button>
            </div>

            {publishError && (
              <p className="text-sm text-red-400">{publishError}</p>
            )}

            {publishStatus === "done" && (
              <p className="text-sm text-green-400">
                ✓ Code is live. Attendees can scan the QR or enter the code. Valid until 1 hour after event start.
              </p>
            )}

            {!authenticated && (
              <Button variant="ghost" className="w-full" onClick={login}>
                Connect wallet to publish
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-8 space-y-6">
            <div>
              <h1 className="font-malinton text-2xl font-bold mb-1">Check in</h1>
              <p className="text-muted-foreground text-sm">
                Enter the 6-character code from the organizer.
              </p>
            </div>

            {checkinStatus === "success" ? (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-8 text-center">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-green-400 font-bold text-lg">Checked in!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your attendance proof has been recorded on Arkiv.
                </p>
              </div>
            ) : (
              <>
                <Input
                  placeholder="e.g. ABC123"
                  value={attendeeCode}
                  onChange={(e) => setAttendeeCode(e.target.value.toUpperCase().slice(0, 6))}
                  className="text-center font-mono text-2xl tracking-widest h-16"
                  maxLength={6}
                />

                {checkinError && (
                  <p className="text-sm text-red-400">{checkinError}</p>
                )}

                <Button
                  className="w-full h-12 gap-2"
                  onClick={handleCheckin}
                  disabled={attendeeCode.length !== 6 || checkinStatus === "loading"}
                >
                  {checkinStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {checkinStatus === "loading" ? "Checking in..." : authenticated ? "Check In" : "Connect & Check In"}
                </Button>

                {!authenticated && (
                  <p className="text-center text-sm text-muted-foreground">
                    You&apos;ll be asked to connect your wallet.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
