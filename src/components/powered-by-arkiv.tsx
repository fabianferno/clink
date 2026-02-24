"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function PoweredByArkiv() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/30 via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-amber-950/30 p-8 text-center sm:p-12"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-emerald-500">
            Built on Arkiv
          </p>
          <h2 className="font-malinton mb-6 text-3xl font-bold text-foreground sm:text-4xl">
            Decentralized data layer
            <br />
            <span className="text-emerald-400">for your events</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            Clink stores all events, RSVPs, and attendance records on Arkiv — a
            decentralized data layer on Ethereum. Your data is queryable,
            time-scoped, and owned by you. No central database. No platform
            lock-in.
          </p>
          <Button variant="outline" size="lg" asChild>
            <a
              href="https://arkiv.network"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              Learn about Arkiv
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
