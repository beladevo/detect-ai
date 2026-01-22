"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-10 w-10" />;

    const currentTheme = theme ?? "system";
    const isDark = resolvedTheme === "dark";
    const nextTheme = currentTheme === "system" ? "light" : currentTheme === "light" ? "dark" : "system";
    const label = `Theme: ${currentTheme}. Switch to ${nextTheme}.`;

    return (
        <button
            onClick={() => setTheme(nextTheme)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            aria-label={label}
        >
            <AnimatePresence mode="wait" initial={false}>
                {currentTheme === "system" ? (
                    <motion.div
                        key="system"
                        initial={{ y: 10, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -10, opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Monitor className="h-5 w-5 text-sky-300" />
                    </motion.div>
                ) : isDark ? (
                    <motion.div
                        key="moon"
                        initial={{ y: 10, opacity: 0, rotate: 45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -10, opacity: 0, rotate: -45 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Moon className="h-5 w-5 text-purple-400" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: 10, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -10, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Sun className="h-5 w-5 text-amber-500" />
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    );
}
