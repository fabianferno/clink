"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, CheckCircle2, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    step: 1,
    icon: Calendar,
    title: "Discover events",
    description: "Browse upcoming events on Arkiv. No wallet needed to explore.",
  },
  {
    step: 2,
    icon: MapPin,
    title: "RSVP & show up",
    description: "Connect your wallet to RSVP. Check in when you arrive.",
  },
  {
    step: 3,
    icon: CheckCircle2,
    title: "Build your Clink Score",
    description: "Every check-in strengthens your reputation. No-shows don't.",
  },
  {
    step: 4,
    icon: Star,
    title: "Unlock better events",
    description: "Organizers can trust high-score attendees. Get access to exclusive events.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="font-malinton mb-6 text-4xl font-bold text-foreground sm:text-5xl">
            From RSVP to reputation
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A simple flow that rewards real attendance and builds trust between
            organizers and attendees.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-white/5 bg-card/50 p-6 backdrop-blur"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
                  {item.step}
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/20">
                  <item.icon className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <h3 className="font-malinton mb-2 text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              {i < steps.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-muted-foreground/30 lg:block">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 flex justify-center"
        >
          <Button size="lg" asChild>
            <Link href="/events">Browse events</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
