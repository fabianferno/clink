"use client";
import { Header } from "@/components/header";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";


export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
  };
  return (
    <main className="min-h-screen bg-black flex flex-col">
      <Header />


      <section className="relative overflow-hidden px-4 pt-32 pb-32 sm:px-6 lg:px-8 bg-black min-h-screen flex items-center justify-center">
        {/* Dynamic Brutalist Background Elements */}
        <div className="absolute inset-0 -z-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />

        {/* Animated Floating Shapes */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-[10%] -z-10 w-64 h-64 border border-primary/30 rounded-full"
        />

        <motion.div
          animate={{
            y: [0, -40, 0],
            rotate: [-12, -5, -12],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 left-[10%] -z-10 w-40 h-40 bg-secondary/10 rounded-[2rem] backdrop-blur-3xl"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-5xl text-center relative z-10 w-full"
        >
          <motion.h1
            variants={itemVariants}
            className="font-malinton mb-8 text-7xl font-black leading-[0.85] tracking-tighter text-white sm:text-8xl lg:text-[9rem]"
          >
            SHOW UP.<br />
            <span className="text-primary italic inline-block mt-2">GET REWARDED.</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-14 max-w-2xl text-xl text-white/60 font-medium leading-relaxed"
          >
            Clink solves the no-show problem. Check in at events, build your <strong className="text-white">on-chain reputation</strong>, and unlock better experiences. Built fully on Arkiv.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button size="lg" asChild className="group gap-2 h-16 px-10 text-lg bg-primary text-black hover:bg-primary/90 font-bold hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,82,162,0.3)] hover:shadow-[0_0_40px_rgba(255,82,162,0.5)]">
              <Link href="/events/create">
                Create an event
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 border border-black/10 rounded-full p-0.5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-16 px-10 text-lg border-white/20 hover:bg-white/10 font-bold hover:scale-105 transition-all active:scale-95 backdrop-blur-sm">
              <Link href="/events">Browse events</Link>
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-24 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-12 text-white/40"
          >
            <div className="flex items-center gap-3 group hover:text-white transition-colors">
              <div className="rounded-full bg-secondary text-black p-3 group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider">Events on Arkiv</span>
            </div>
            <div className="flex items-center gap-3 group hover:text-white transition-colors">
              <div className="rounded-full bg-primary text-black p-3 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider">Verifiable attendance</span>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
