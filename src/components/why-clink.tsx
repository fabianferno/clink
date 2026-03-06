"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { useRef, useEffect } from "react";
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

// Cards scattered around the center. depth = parallax intensity
const cardLayout = [
  { top: "8%", left: "-5%", width: "min(440px,85vw)", rotate: -3, z: 1, depth: 1.2 },
  { top: "12%", right: "-10%", left: "auto", width: "min(420px,80vw)", rotate: 2, z: 2, depth: 0.8 },
  { top: "58%", left: "-10%", width: "min(440px,82vw)", rotate: 1.5, z: 3, depth: 1.4 },
  { top: "62%", right: "-8%", left: "auto", width: "min(400px,78vw)", rotate: -2.5, z: 0, depth: 1 },
];

function ParallaxCard({
  item,
  index,
  mouseX,
  mouseY,
  scrollYProgress,
  layout,
}: {
  item: (typeof differentiators)[0];
  index: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
  layout: (typeof cardLayout)[0];
}) {
  // Mouse parallax: cards at different depths move different amounts
  const springX = useSpring(
    useTransform(mouseX, [-1, 1], [layout.depth * 28, -layout.depth * 28])
  );
  const springY = useSpring(
    useTransform(mouseY, [-1, 1], [layout.depth * 18, -layout.depth * 18])
  );

  // Scroll parallax: visible movement as section scrolls
  const scrollY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [
    layout.depth * 80,
    layout.depth * 15,
    -layout.depth * 15,
    -layout.depth * 80,
  ]);
  const scrollX = useTransform(scrollYProgress, [0, 0.5, 1], [
    layout.depth * 40,
    0,
    -layout.depth * 40,
  ]);

  // Combine mouse + scroll parallax
  const x = useTransform([springX, scrollX], ([mx, sx]: number[]) => (mx ?? 0) + (sx ?? 0));
  const y = useTransform([springY, scrollY], ([my, sy]: number[]) => (my ?? 0) + (sy ?? 0));

  return (
    <motion.div
      style={{
        position: "absolute",
        top: layout.top,
        left: layout.left,
        right: layout.right,
        width: layout.width,
        zIndex: layout.z,
        x,
        y,
        rotate: layout.rotate,
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/80 p-6 backdrop-blur-xl shadow-xl"
    >
      <div className="absolute top-6 right-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-12 sm:w-12">
        <item.icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
      </div>
      <div className="flex-1 min-w-0 pr-14 sm:pr-16">
        <h3 className="font-malinton mb-1.5 text-lg font-semibold text-foreground sm:text-xl">
          {item.title}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground sm:text-base">{item.description}</p>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary sm:text-sm">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Clink: {item.clink}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground sm:text-sm">
            <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Others: {item.others}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function WhyClink() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    const el = cardsRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);
      mouseX.set(Math.max(-1, Math.min(1, x)));
      mouseY.set(Math.max(-1, Math.min(1, y)));
    };

    const handleLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
      </div>

      {/* Single container: header centered, cards scattered around it */}
      <div
        ref={cardsRef}
        className="relative min-h-[800px] w-full max-w-7xl mx-auto flex items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        {/* Header - centered in the middle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 mx-auto max-w-3xl text-center px-4"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
            Why Clink
          </p>
          <h2 className="font-malinton mb-6 text-4xl font-bold text-foreground sm:text-5xl">
            Not another event platform.
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              A new paradigm.
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Luma, Eventbrite, and Meetup are great — but they own your data. Clink is
            built on Arkiv so you own your events, your community, and your reputation.
          </p>
        </motion.div>

        {/* Cards scattered around the center */}
        {differentiators.map((item, i) => (
          <ParallaxCard
            key={item.title}
            item={item}
            index={i}
            mouseX={mouseX}
            mouseY={mouseY}
            scrollYProgress={scrollYProgress}
            layout={cardLayout[i]}
          />
        ))}
      </div>
    </section>
  );
}
