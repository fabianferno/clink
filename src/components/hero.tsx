"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-24 sm:px-6 lg:px-8 bg-black">
      {/* Brutalist Background Elements */}
      <div className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />

      {/* Decorative stark shapes */}
      <div className="absolute top-20 right-10 -z-10 w-64 h-64 border-2 border-primary/20 rounded-full animate-spin-slow" style={{ animationDuration: '30s' }} />
      <div className="absolute bottom-10 left-10 -z-10 w-32 h-32 bg-secondary/10 rounded-[2rem] rotate-12" />

      <div className="mx-auto max-w-4xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">
            Event platform that rewards showing up
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-malinton mb-8 text-6xl font-black leading-[0.9] tracking-tighter text-white sm:text-7xl lg:text-8xl"
        >
          SHOW UP.<br />
          <span className="text-primary italic">GET REWARDED.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto mb-12 max-w-2xl text-lg text-white/60 font-medium"
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
          <Button size="lg" asChild className="group gap-2 h-14 px-8 text-lg bg-primary text-black hover:bg-primary/90 font-bold">
            <Link href="/events/create">
              Create an event
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="h-14 px-8 text-lg border-white/20 hover:bg-white/10 font-bold">
            <Link href="/events">Browse events</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-24 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-12 text-white/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-secondary text-black p-2.5">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Events on Arkiv</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary text-black p-2.5">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Verifiable attendance</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
