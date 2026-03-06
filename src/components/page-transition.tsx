"use client";

import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Minimal fallback shown during client-side navigation while the new page loads.
 * Prevents blank screen when Next.js streams the new RSC payload.
 */
function PageTransitionFallback() {
    return (
        <div className="flex-1 w-full min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
        </div>
    );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="sync" initial={false}>
            <motion.div
                key={pathname}
                initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 w-full"
            >
                <Suspense fallback={<PageTransitionFallback />}>
                    {children}
                </Suspense>
            </motion.div>
        </AnimatePresence>
    );
}
