"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Database,
  TrendingUp,
  Unlock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const differentiators = [
  {
    icon: Database,
    title: "You own your data",
    description:
      "Events, RSVPs, and attendance records live on Arkiv — not on our servers. Organizers and attendees own their data. Luma keeps everything on their platform.",
    clink: "Your data",
    others: "Their data",
  },
  {
    icon: TrendingUp,
    title: "Clink Score — reputation that matters",
    description:
      "Check in at events. Build your Clink Score. Unlock better events. Your reputation travels with you. No other event platform rewards showing up.",
    clink: "Verifiable reputation",
    others: "No reputation system",
  },
  {
    icon: Shield,
    title: "On-chain verification",
    description:
      "Attendance is verifiable on-chain. No central authority can fake or delete your records. Luma and others rely on trust in their database.",
    clink: "Cryptographic proof",
    others: "Trust the platform",
  },
  {
    icon: Unlock,
    title: "No platform lock-in",
    description:
      "Your events aren't tied to a single company. If Clink disappears, your data lives on Arkiv. With Luma, you're locked to their ecosystem.",
    clink: "Portable, forever",
    others: "Locked to platform",
  },
];

export function WhyClink() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-emerald-500">
            Why Clink
          </p>
          <h2 className="font-malinton mb-6 text-4xl font-bold text-foreground sm:text-5xl">
            Not another event platform.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
              A new paradigm.
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Luma, Eventbrite, and Meetup are great — but they own your data. Clink
            is built on Arkiv so you own your events, your community, and your
            reputation.
          </p>
        </motion.div>

        <div className="space-y-12">
          {differentiators.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col gap-6 rounded-2xl border border-white/5 bg-card/50 p-8 backdrop-blur sm:flex-row sm:items-start"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <item.icon className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-malinton mb-2 text-xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mb-6 text-muted-foreground">{item.description}</p>
                <div className="flex flex-wrap gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Clink: {item.clink}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    Others: {item.others}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
