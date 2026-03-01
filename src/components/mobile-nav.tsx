"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, PlusCircle, User } from "lucide-react";
import { useAuth } from "@/components/providers";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function MobileNav() {
    const pathname = usePathname();
    const { authenticated, login } = useAuth();

    // Don't show mobile nav on auth-required pages if not authenticated 
    // (though the pages handle this themselves, it's good UX)

    const navItems = [
        {
            name: "Home",
            href: "/",
            icon: Home,
        },
        {
            name: "Events",
            href: "/events",
            icon: Calendar,
        },
        {
            name: "Create",
            href: "/events/create",
            icon: PlusCircle,
        },
        {
            name: "Profile",
            href: "/profile",
            icon: User,
            requiresAuth: true,
        }
    ];

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-4 right-4 z-50 md:hidden flex justify-center pointer-events-none pb-safe"
        >
            <div className="bg-[#141414]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.8)] px-2 py-1 pointer-events-auto w-full max-w-[400px]">
                <div className="grid grid-cols-4 items-center h-[64px]">
                    {navItems.map((item) => {
                        // Fix active logic: exact match for root and /events, startsWith for others like profile subpages if needed
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : item.href === "/events"
                                    ? pathname === "/events" || pathname.startsWith("/events/") && !pathname.startsWith("/events/create")
                                    : pathname.startsWith(item.href);

                        const content = (
                            <>
                                <div className={cn(
                                    "relative flex items-center justify-center p-2 rounded-full transition-all duration-300",
                                    isActive ? "text-primary" : "text-white/40 group-hover:text-white"
                                )}>
                                    <item.icon
                                        className={cn("w-[22px] h-[22px] z-10 relative", isActive && "drop-shadow-[0_0_8px_rgba(255,82,162,0.8)]")}
                                        fill={isActive ? "currentColor" : "none"}
                                        strokeWidth={isActive ? 2 : 2.5}
                                    />

                                    {/* Active pill background */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobileNavPill"
                                            className="absolute inset-0 bg-primary/10 rounded-full"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[9px] font-bold tracking-widest uppercase mt-0.5 transition-colors duration-300 text-center",
                                    isActive ? "text-primary" : "text-white/40 group-hover:text-white"
                                )}>
                                    {item.name}
                                </span>
                            </>
                        );

                        const interactiveProps = {
                            className: "flex flex-col items-center justify-center w-full h-full group touch-manipulation outline-none relative cursor-pointer",
                        };

                        if (item.requiresAuth && !authenticated) {
                            return (
                                <button
                                    key={item.name}
                                    onClick={login}
                                    {...interactiveProps}
                                >
                                    {content}
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                {...interactiveProps}
                            >
                                {content}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
