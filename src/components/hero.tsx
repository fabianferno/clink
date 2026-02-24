"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-24 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent" />
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 text-sm font-medium uppercase tracking-widest text-emerald-500"
        >
          Event platform that rewards showing up
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-malinton mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
        >
          Show up.
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
            Get rewarded.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground"
        >
          Clink solves the no-show problem. Check in at events, build your Clink
          Score, and unlock better events. Your reputation travels with you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button size="lg" asChild className="group gap-2">
            <Link href="/events/create">
              Create an event
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/events">Browse events</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-12 text-muted-foreground"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/10 p-3">
              <Calendar className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-sm">Events on Arkiv</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-3">
              <Users className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-sm">Verifiable attendance</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
