"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Copy, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-16">
        <Link
          href={`/events/${entityKey}`}
          className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to event
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

  const [attendeeCode, setAttendeeCode] = useState("");
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

  // Organizer: publish check-in code to Arkiv
  const handlePublishCode = async () => {
    if (!authenticated) { login(); return; }
    const wallet = wallets[0];
    if (!wallet) { setPublishError("No wallet connected."); return; }

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
        expiresIn: ExpirationTime.fromHours(2),
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

        await wc.updateEntity({
          entityKey: rsvpEntity.key,
          payload: jsonToPayload({ ...rsvpPayload, checkedIn: true, checkedInTimestamp: now }),
          contentType: "application/json",
          attributes: rsvpAttrs.map((a) =>
            a.key === "checked_in" ? { key: "checked_in", value: 1 } : a
          ),
          expiresIn: ExpirationTime.fromDays(60),
        });
      } else {
        // Walk-in: create RSVP entity with checked_in: 1 directly
        await wc.createEntity({
          payload: jsonToPayload({
            attendeeAddress: walletAddress,
            attendeeName: displayName,
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
            { key: "checked_in", value: 1 },
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
            if (a.key === "show_up_rate") return { key: "show_up_rate", value: showUpRate };
            if (a.key === "streak") return { key: "streak", value: streak };
            if (a.key === "last_checkin") return { key: "last_checkin", value: now };
            if (a.key === "newcomer") return { key: "newcomer", value: newcomer };
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
        className="mx-auto max-w-2xl px-4 pt-24 pb-16"
      >
        <Link
          href={`/events/${entityKey}`}
          className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to event
        </Link>

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

        {mode === "organizer" ? (
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-8 space-y-6">
            <div>
              <h1 className="font-malinton text-2xl font-bold mb-1">Check-in code</h1>
              <p className="text-muted-foreground text-sm">
                Publish this code to Arkiv, then share it with attendees.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 rounded-xl bg-muted/30 p-8">
              <QrCode className="h-16 w-16 text-muted-foreground" />
              <span className="font-mono text-4xl font-bold tracking-widest">{code}</span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={copyCode}>
                {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy</>}
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handlePublishCode}
                disabled={publishStatus === "loading" || publishStatus === "done"}
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
                ✓ Code is live. Attendees can now check in with this code. Valid for 2 hours.
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
