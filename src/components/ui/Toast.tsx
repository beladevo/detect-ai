"use client";

import { motion } from "framer-motion";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { ToastMessage, ToastVariant } from "@/src/context/ToastContext";

interface ToastProps extends ToastMessage {
    onClose: () => void;
}

const variants: Record<ToastVariant, { icon: React.ReactNode; color: string; borderColor: string; glow: string }> = {
    default: {
        icon: <Info className="h-5 w-5" />,
        color: "from-blue-500/20 to-blue-500/10",
        borderColor: "border-blue-500/20",
        glow: "shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    },
    success: {
        icon: <CheckCircle className="h-5 w-5" />,
        color: "from-emerald-500/20 to-emerald-500/10",
        borderColor: "border-emerald-500/20",
        glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    },
    error: {
        icon: <AlertCircle className="h-5 w-5" />,
        color: "from-red-500/20 to-red-500/10",
        borderColor: "border-red-500/20",
        glow: "shadow-[0_0_30px_rgba(239,68,68,0.15)]",
    },
    warning: {
        icon: <AlertTriangle className="h-5 w-5" />,
        color: "from-amber-500/20 to-amber-500/10",
        borderColor: "border-amber-500/20",
        glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    },
};

export default function Toast({ title, description, variant = "default", onClose }: ToastProps) {
    const style = variants[variant];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto relative flex w-full items-start gap-4 overflow-hidden rounded-xl border ${style.borderColor} bg-gradient-to-br ${style.color} p-4 backdrop-blur-md ${style.glow}`}
        >
            <div className={`mt-0.5 rounded-full bg-white/5 p-1 text-white`}>{style.icon}</div>
            <div className="flex-1">
                {title && <h3 className="font-semibold text-white">{title}</h3>}
                <p className="text-sm text-gray-300">{description}</p>
            </div>
            <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
                <X className="h-4 w-4" />
            </button>

            {/* Glass shine effect */}
            <div
                className="pointer-events-none absolute inset-0 rounded-xl opacity-20"
                style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
                }}
            />
        </motion.div>
    );
}
