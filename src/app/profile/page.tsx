"use client";

import { useAuth } from "@/components/providers";
import { useWallets } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Calendar, TrendingUp, Loader2, Pencil, Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";
import { PatternGraphic } from "@/components/ui/pattern-graphic";
import { publicClient } from "@/lib/arkiv";
import { createArkivWalletClient } from "@/lib/arkiv-wallet";
import { eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { mendoza } from "@arkiv-network/sdk/chains";

const hasPrivy =
  typeof process.env.NEXT_PUBLIC_PRIVY_APP_ID === "string" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "placeholder" &&
  process.env.NEXT_PUBLIC_PRIVY_APP_ID.length >= 10;

interface ProfileData {
  entityKey: string;
  displayName: string;
  totalRsvps: number;
  totalCheckins: number;
  showUpRate: number; // 0–100
  currentStreak: number;
  isNewcomer: boolean;
}

function scoreColor(rate: number, isNewcomer: boolean) {
  if (isNewcomer) return "text-white/60";
  if (rate >= 80) return "text-green-400";
  if (rate >= 50) return "text-yellow-400";
  return "text-red-400";
}

export default function ProfilePage() {
  const { ready, authenticated, login, user } = useAuth();
  const { wallets } = useWallets();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [saveNameLoading, setSaveNameLoading] = useState(false);
  const [saveNameError, setSaveNameError] = useState<string | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);

  const walletAddress =
    user?.wallet?.address ??
    (user?.linkedAccounts?.find((a: { type: string }) => a.type === "wallet") as
      | { address: string }
      | undefined)?.address ??
    "0x000000000000000000";
  const displayName = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  useEffect(() => {
    if (!authenticated || !walletAddress || walletAddress === "0x000000000000000000") return;

    let cancelled = false;
    async function fetchProfile() {
      setProfileLoading(true);
      try {
        const q = publicClient.buildQuery();
        const result = await q
          .where(eq("type", "profile"))
          .where(eq("address", walletAddress))
          .withPayload(true)
          .withAttributes(true)
          .limit(1)
          .fetch();

        if (cancelled) return;

        if (result.entities.length === 0) {
          setProfile(null);
        } else {
          const entity = result.entities[0];
          const pd = entity.toJson() as Record<string, unknown>;
          const attrs = entity.attributes || [];
          const newcomerAttr = attrs.find((a) => a.key === "newcomer");
          const isNewcomer = newcomerAttr ? Number(newcomerAttr.value) === 1 : true;
          const rawRate = (pd.showUpRate as number) || 0;
          // showUpRate stored as 0.0–1.0 in payload, or 0–100 in attribute
          const showUpRate = rawRate <= 1 ? Math.round(rawRate * 100) : Math.round(rawRate);

          setProfile({
            entityKey: entity.key,
            displayName: (pd.displayName as string) || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
            totalRsvps: (pd.totalRsvps as number) || 0,
            totalCheckins: (pd.totalCheckins as number) || 0,
            showUpRate,
            currentStreak: (pd.currentStreak as number) || 0,
            isNewcomer,
          });
        }
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [authenticated, walletAddress]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-black overflow-x-hidden flex flex-col relative">
        <Header />
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 pt-28 pb-12 flex flex-col relative z-10 animate-pulse">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">
              Profile <span className="text-secondary">✦</span>
            </h1>
          </div>
          <div className="bg-[#141414] rounded-[2rem] w-full flex flex-col border border-white/5 shadow-2xl overflow-hidden relative min-h-[500px]">
            <div className="p-6 pb-2 w-full flex flex-col items-center">
              <div className="w-32 h-32 rounded-[1.5rem] bg-white/10 mb-6" />
              <div className="h-10 w-48 bg-white/10 rounded-lg mb-4" />
              <div className="h-6 w-32 bg-white/5 rounded-full" />
            </div>
            <div className="w-full relative py-6">
              <div className="absolute w-8 h-8 rounded-full bg-black -left-4 top-1/2 -translate-y-1/2 z-10" />
              <div className="w-full border-t-[3px] border-dashed border-white/10" />
              <div className="absolute w-8 h-8 rounded-full bg-black -right-4 top-1/2 -translate-y-1/2 z-10" />
            </div>
            <div className="px-8 pb-8 flex flex-col gap-6">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 h-36" />
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 h-24" />
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 h-24" />
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 h-24" />
              </div>
            </div>
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
            <User className="w-10 h-10 text-white/40" />
          </div>
          <h1 className="font-malinton text-4xl font-black text-white mb-4">CONNECT IDENTITY</h1>
          <p className="text-white/60 mb-8 font-medium">
            Your Clink Score and attendance history appear here after you connect. Built fully on Arkiv.
          </p>
          <Button
            onClick={login}
            size="lg"
            className="w-full h-14 bg-primary text-black font-bold hover:bg-primary/90 text-lg"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  const clinkScore = profile?.isNewcomer ? null : (profile?.showUpRate ?? null);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden flex flex-col relative">
      <Header />

      <div className="absolute top-0 right-0 w-full max-w-lg h-[500px] bg-secondary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full max-w-lg h-[400px] bg-primary/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full max-w-7xl mx-auto px-4 pt-28 pb-12 flex flex-col relative z-10"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            Profile <span className="text-secondary">✦</span>
          </h1>
        </div>

        {/* Identity Ticket Layout */}
        <div className="bg-[#141414] rounded-[2rem] w-full flex flex-col border border-white/5 shadow-2xl overflow-hidden relative">
          {/* Avatar Area */}
          <div className="p-6 pb-2 w-full flex flex-col items-center">
            <div className="w-32 h-32 rounded-[1.5rem] overflow-hidden border-2 border-white/10 relative mb-6 shrink-0 bg-black">
              <PatternGraphic
                seed={walletAddress}
                variant="pink"
                className="scale-150 transform origin-center"
              />
            </div>
            <div className="w-full max-w-[320px] flex flex-col items-center gap-2">
              {isEditingName && hasPrivy && profile ? (
                <div className="flex flex-col gap-2 w-full">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, 32))}
                    placeholder="Your display name"
                    className="text-center font-malinton text-xl bg-white/5 border-white/20 text-white"
                    maxLength={32}
                    autoFocus
                  />
                  {saveNameError && <p className="text-xs text-red-400 text-center">{saveNameError}</p>}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-white/20 text-white"
                      onClick={() => {
                        setIsEditingName(false);
                        setSaveNameError(null);
                      }}
                      disabled={saveNameLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1 bg-white text-black"
                      onClick={async () => {
                        const name = editName.trim() || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
                        if (!wallets[0] || !profile) return;
                        setSaveNameLoading(true);
                        setSaveNameError(null);
                        try {
                          const provider = await wallets[0].getEthereumProvider();
                          await wallets[0].switchChain(mendoza.id);
                          const wc = createArkivWalletClient(provider, wallets[0].address as `0x${string}`);
                          const profileQ = publicClient.buildQuery();
                          const profileResult = await profileQ
                            .where(eq("type", "profile"))
                            .where(eq("address", walletAddress))
                            .withPayload(true)
                            .withAttributes(true)
                            .limit(1)
                            .fetch();
                          if (profileResult.entities.length === 0) throw new Error("Profile not found");
                          const existingProfile = profileResult.entities[0];
                          const existingPd = existingProfile.toJson() as Record<string, unknown>;
                          await wc.updateEntity({
                            entityKey: existingProfile.key,
                            payload: jsonToPayload({ ...existingPd, displayName: name }),
                            contentType: "application/json",
                            attributes: existingProfile.attributes || [],
                            expiresIn: ExpirationTime.fromDays(365),
                          });
                          setProfile((p) => p ? { ...p, displayName: name } : null);
                          setIsEditingName(false);
                        } catch (err) {
                          setSaveNameError(err instanceof Error ? err.message : "Failed to save");
                        } finally {
                          setSaveNameLoading(false);
                        }
                      }}
                      disabled={saveNameLoading}
                    >
                      {saveNameLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="font-malinton text-4xl font-bold text-white leading-tight text-center break-all">
                    {profile?.displayName ?? displayName}
                  </h2>
                  {hasPrivy && profile && (
                    <button
                      onClick={() => {
                        setEditName(profile.displayName);
                        setIsEditingName(true);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                      aria-label="Edit display name"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-full max-w-[400px]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
              <p className="text-white/80 text-xs font-mono break-all flex-1 select-all">
                {walletAddress}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(walletAddress);
                      setAddressCopied(true);
                      setTimeout(() => setAddressCopied(false), 2000);
                    } catch {
                      // fallback for older browsers
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  aria-label="Copy address"
                  title="Copy address"
                >
                  {addressCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
                <a
                  href={`https://explorer.mendoza.hoodi.arkiv.network/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                  aria-label="View on Arkiv Explorer"
                  title="View on Arkiv Explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Dotted Separator */}
          <div className="w-full relative py-6">
            <div className="absolute w-8 h-8 rounded-full bg-black -left-4 top-1/2 -translate-y-1/2 z-10" />
            <div className="w-full border-t-[3px] border-dashed border-white/10" />
            <div className="absolute w-8 h-8 rounded-full bg-black -right-4 top-1/2 -translate-y-1/2 z-10" />
          </div>

          {/* Core Stats Area */}
          <div className="px-8 pb-8 flex flex-col gap-6">
            {/* Clink Score */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
                <TrendingUp className="w-16 h-16 text-primary" />
              </div>
              <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-2">
                Clink Score
              </p>

              {profileLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-white/30" />
              ) : clinkScore !== null ? (
                <div className="flex items-end gap-3">
                  <span className={`text-5xl font-black leading-none tracking-tighter ${scoreColor(clinkScore, false)}`}>
                    {clinkScore}%
                  </span>
                  <Badge
                    className={`h-6 font-bold uppercase tracking-widest text-[10px] border ${clinkScore >= 80
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : clinkScore >= 50
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}
                  >
                    {clinkScore >= 80 ? "Reliable" : clinkScore >= 50 ? "Average" : "Risky"}
                  </Badge>
                </div>
              ) : (
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-white leading-none tracking-tighter">
                    —
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white/60 font-bold uppercase tracking-widest text-[10px] h-6"
                  >
                    {profile === null && !profileLoading ? "No activity" : "Newcomer"}
                  </Badge>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <p className="text-sm text-white/80 font-medium">
                  Your Clink Score is your <strong className="text-white">show-up rate</strong> — the percentage of events you RSVP to and actually attend. Organizers use it to gauge reliability; a higher score builds trust and unlocks better opportunities.
                </p>
                <div className="rounded-xl bg-black/30 border border-white/5 p-4">
                  <p className="text-xs font-bold text-white/90 uppercase tracking-wider mb-2">How to increase your score</p>
                  <ul className="text-xs text-white/70 space-y-1.5">
                    <li>• <strong>Show up</strong> — Check in at events you RSVP to. Each check-in improves your rate.</li>
                    <li>• <strong>RSVP thoughtfully</strong> — Only RSVP when you plan to attend. No-shows lower your score.</li>
                    <li>• <strong>Build a streak</strong> — Consecutive check-ins boost your reputation.</li>
                    <li>• <strong>Stay consistent</strong> — Aim for 80%+ to earn a &quot;Reliable&quot; badge.</li>
                  </ul>
                </div>
                <p className="text-xs text-white/50 font-medium">
                  {profile === null && !profileLoading
                    ? "RSVP to your first event to start building your score."
                    : profile?.isNewcomer
                      ? `${profile.totalRsvps}/3 RSVPs to activate your score.`
                      : "Based on your show-up rate across all events."}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">
                  RSVPs
                </p>
                {profileLoading ? (
                  <div className="h-8 w-8 mx-auto rounded bg-white/10 animate-pulse" />
                ) : (
                  <span className="text-2xl font-black text-white">{profile?.totalRsvps ?? 0}</span>
                )}
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Calendar className="w-8 h-8 text-secondary" />
                </div>
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">
                  Attended
                </p>
                {profileLoading ? (
                  <div className="h-8 w-8 mx-auto rounded bg-white/10 animate-pulse" />
                ) : (
                  <span className="text-2xl font-black text-white">{profile?.totalCheckins ?? 0}</span>
                )}
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">
                  Streak
                </p>
                {profileLoading ? (
                  <div className="h-8 w-8 mx-auto rounded bg-white/10 animate-pulse" />
                ) : (
                  <span className="text-2xl font-black text-white">
                    {profile?.currentStreak ?? 0}
                    {(profile?.currentStreak ?? 0) > 0 && (
                      <span className="text-sm ml-1">🔥</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-8 pt-0 mt-auto flex flex-col gap-4">
            <Button
              size="lg"
              className="w-full h-14 text-lg bg-white text-black hover:bg-white/90 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              asChild
            >
              <Link href="/events">Explore Events</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
