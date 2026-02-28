import { Header } from "@/components/header";
import { WhyClink } from "@/components/why-clink";
import { HowItWorks } from "@/components/how-it-works";
import { ForOrganizersAttendees } from "@/components/for-organizers-attendees";
import { PoweredByArkiv } from "@/components/powered-by-arkiv";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export const metadata = {
    title: "About Clink - Event Platform",
    description: "Learn how Clink solves the no-show problem with on-chain reputation.",
};

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-black pb-24">
            <Header />

            {/* Background aesthetics */}
            <div className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />

            {/* Minimal Header area for About page */}
            <div className="mx-auto max-w-7xl pt-32 px-4 sm:px-6 lg:px-8 mb-12">
                <Link
                    href="/"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-white/50 hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back Home
                </Link>
                <h1 className="font-malinton text-5xl font-black tracking-tighter text-white sm:text-6xl">
                    ABOUT CLINK.
                </h1>
                <p className="mt-4 text-xl text-white/60 max-w-2xl font-medium">
                    The event platform that rewards you for showing up. Built on Arkiv.
                </p>
            </div>

            <WhyClink />
            <HowItWorks />
            <ForOrganizersAttendees />
            <PoweredByArkiv />
        </main>
    );
}
