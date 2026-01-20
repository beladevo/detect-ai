"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import Toast from "@/src/components/ui/Toast";

export type ToastVariant = "default" | "success" | "error" | "warning";

export interface ToastMessage {
    id: string;
    title?: string;
    description: string;
    variant?: ToastVariant;
    duration?: number;
}

interface ToastContextType {
    toast: (props: Omit<ToastMessage, "id">) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const toast = useCallback(
        ({ title, description, variant = "default", duration = 5000 }: Omit<ToastMessage, "id">) => {
            const id = Math.random().toString(36).substring(2, 9);
            const newToast = { id, title, description, variant, duration };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                setTimeout(() => {
                    removeToast(id);
                }, duration);
            }
        },
        [removeToast]
    );

    // Listen for custom "dispatch-toast" events
    useEffect(() => {
        const handleDispatchToast = (event: Event) => {
            const customEvent = event as CustomEvent<Omit<ToastMessage, "id">>;
            toast(customEvent.detail);
        };

        window.addEventListener("dispatch-toast", handleDispatchToast);
        return () => window.removeEventListener("dispatch-toast", handleDispatchToast);
    }, [toast]);

    // Global Error Handler
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            toast({
                title: "Application Error",
                description: event.message || "An unexpected error occurred.",
                variant: "error",
            });
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            // Extract meaningful message from rejection reason
            let message = "An unexpected error occurred.";
            if (typeof event.reason === "string") {
                message = event.reason;
            } else if (event.reason instanceof Error) {
                message = event.reason.message;
            }

            toast({
                title: "Promise Error",
                description: message,
                variant: "error",
            });
        };

        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleRejection);

        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleRejection);
        };
    }, [toast]);

    return (
        <ToastContext.Provider value={{ toast, removeToast }}>
            {children}
            <div className="fixed bottom-0 right-0 z-[100] flex flex-col gap-2 p-4 sm:bottom-4 sm:right-4 sm:max-w-[420px] w-full pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
