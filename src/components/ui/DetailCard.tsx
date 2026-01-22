"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, type LucideIcon } from "lucide-react";

interface DetailCardProps {
    title: string;
    icon: LucideIcon | React.ElementType;
    color: "purple" | "cyan" | "pink";
    score: number;
    scoreLabel?: string;
    metrics: Array<{
        label: string;
        value: number;
        threshold?: number;
        isBinary?: boolean;
        invertColor?: boolean;
    }>;
    flags: string[];
}

export default function DetailCard({
    title,
    icon: Icon,
    color,
    score,
    scoreLabel = "Risk Score",
    metrics,
    flags,
}: DetailCardProps) {
    const colors = {
        purple: {
            text: "text-brand-purple",
            bg: "bg-brand-purple",
            border: "border-brand-purple/20",
            badge: "bg-brand-purple/10 text-brand-purple dark:text-purple-200",
        },
        cyan: {
            text: "text-brand-cyan",
            bg: "bg-brand-cyan",
            border: "border-brand-cyan/20",
            badge: "bg-brand-cyan/10 text-brand-cyan dark:text-cyan-200",
        },
        pink: {
            text: "text-brand-pink",
            bg: "bg-brand-pink",
            border: "border-brand-pink/20",
            badge: "bg-brand-pink/10 text-brand-pink dark:text-pink-200",
        },
    };
    const theme = colors[color];

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-5 transition-all duration-500 hover:border-border/60 hover:bg-card/60`}
        >
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`rounded-lg bg-card/20 p-2 ${theme.text}`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-semibold text-foreground">{title}</h4>
                </div>
                <div className="text-right">
                    <div className={`text-xl font-bold ${theme.text}`}>
                        {score.toFixed(0)}%
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">
                        {scoreLabel}
                    </div>
                </div>
            </div>

            <div className="mb-4 space-y-3">
                {metrics.map((m) => (
                    <div key={m.label} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{m.label}</span>
                            <span>
                                {m.isBinary
                                    ? m.value
                                        ? "Detected"
                                        : "None"
                                    : `${(m.value * 100).toFixed(0)}%`}
                            </span>
                        </div>
                        {!m.isBinary && (
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${Math.min(100, Math.max(0, m.value * 100))}%`,
                                    }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full rounded-full ${m.invertColor ? "bg-emerald-500" : theme.bg
                                        } opacity-80`}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                {flags.length > 0 ? (
                    flags.map((flag) => (
                        <span
                            key={flag}
                            className={`rounded-md border ${theme.border} ${theme.badge} px-2 py-1 text-[10px] font-medium uppercase tracking-wide`}
                        >
                            {flag.replace(/_/g, " ")}
                        </span>
                    ))
                ) : (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <CheckCircle2 className="h-3 w-3" />
                        No anomalies detected
                    </span>
                )}
            </div>
        </div>
    );
}
