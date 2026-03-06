"use client";
import { Header } from "@/components/header";
import { WhyClink } from "@/components/why-clink";
import { HowItWorks } from "@/components/how-it-works";
import { ForOrganizersAttendees } from "@/components/for-organizers-attendees";
import { PoweredByArkiv } from "@/components/powered-by-arkiv";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShinyText from "@/components/ui/shiny-text";


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
    <main className="min-h-screen flex flex-col">
      <Header />


      <section className="relative overflow-hidden min-h-screen flex flex-col">
        {/* Dynamic Brutalist Background Elements */}
        <div className="absolute inset-0 -z-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />

        {/* Video with logo clip-mask - top right, ~60% of screen */}
        <div
          className="absolute filter hue-rotate-320 -top-325 md:-top-250 right-0 w-[90vw] h-[80vh] min-h-[3000px] md:w-[60vw] md:h-[60vh] md:min-h-[2800px] z-0"
          style={{
            maskImage: "url('/logo.svg')",
            maskSize: "contain",
            maskPosition: "center",
            maskRepeat: "no-repeat",
            WebkitMaskImage: "url('/logo.svg')",
            WebkitMaskSize: "contain",
            WebkitMaskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
          }}
        >
          <video
            autoPlay
            muted
            loop
            width={3000}
            height={3000}
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/crowd-gathering.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Hero text and description - bottom left */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative mx-auto z-10 mt-auto px-4 pb-16 pt-[340px] md:pt-8 sm:px-6 lg:px-8 w-full max-w-7xl"
        >
          <motion.h1
            variants={itemVariants}
            className="font-malinton mb-6 text-6xl font-black leading-[0.85] tracking-tighter text-white sm:text-7xl lg:text-8xl"
          >
            SHOW UP.<br />
            <ShinyText
              text="GET REWARDED."
              color="#FF52A2"
              shineColor="#ffffff"
              className="italic mt-2"
              speed={2.5}
              spread={150}
            />
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mb-10 text-lg text-white/60 font-medium leading-relaxed sm:text-xl max-w-xl text-left"
          >
            Clink solves the no-show problem. Check in at events, build your <strong className="text-white">on-chain reputation</strong>, and unlock better experiences. Built fully on Arkiv.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <Button size="lg" asChild className="group gap-2 h-14 px-8 text-base bg-primary text-black hover:bg-primary/90 font-bold hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,82,162,0.3)] hover:shadow-[0_0_40px_rgba(255,82,162,0.5)]">
              <Link href="/events/create">
                Create an event
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 border border-black/10 rounded-full p-0.5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-14 px-8 text-base border-white/20 hover:bg-white/10 font-bold hover:scale-105 transition-all active:scale-95 backdrop-blur-sm">
              <Link href="/events">Browse events</Link>
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center gap-8 text-white/40"
          >
            <div className="flex items-center gap-3 group hover:text-white transition-colors">
              <div className="rounded-full bg-secondary text-black p-2.5 group-hover:scale-110 transition-transform">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider">Events on Arkiv</span>
            </div>
            <div className="flex items-center gap-3 group hover:text-white transition-colors">
              <div className="rounded-full bg-primary text-black p-2.5 group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider">Verifiable attendance</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <HowItWorks />
      <WhyClink />
      <ForOrganizersAttendees />
      <PoweredByArkiv />
    </main>
  );
}
