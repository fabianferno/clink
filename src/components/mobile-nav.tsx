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
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe"
        >
            <div className="flex justify-around items-center px-2 py-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");

                    if (item.requiresAuth && !authenticated) {
                        return (
                            <button
                                key={item.name}
                                onClick={login}
                                className="flex flex-col items-center justify-center w-16 gap-1"
                            >
                                <div className="p-1.5 rounded-full text-white/50 transition-colors">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-medium text-white/50">
                                    {item.name}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex flex-col items-center justify-center w-16 gap-1 group relative"
                        >
                            <div className={cn(
                                "p-1.5 rounded-full transition-all duration-300",
                                isActive ? "text-primary" : "text-white/50 group-hover:text-white"
                            )}>
                                <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold tracking-wider uppercase transition-colors",
                                isActive ? "text-primary" : "text-white/50 group-hover:text-white"
                            )}>
                                {item.name}
                            </span>

                            {/* Active Indicator Dot */}
                            {isActive && (
                                <motion.div
                                    layoutId="mobileNavActiveIndicator"
                                    className="absolute -top-1 w-1 h-1 rounded-full bg-primary"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </motion.div>
    );
}
