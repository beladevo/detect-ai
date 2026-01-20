"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Twitter, Linkedin, Copy, Check, Share2 } from "lucide-react";
import GlassCard from "./ui/GlassCard";
import GlowButton from "./ui/GlowButton";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: {
        score: number;
        verdict: "ai" | "real" | "uncertain";
    };
}

export default function ShareModal({ isOpen, onClose, result }: ShareModalProps) {
    const [copied, setCopied] = React.useState(false);

    const shareText = `I just analyzed an image on DetectAI and it's ${result.score}% likely to be ${result.verdict === 'ai' ? 'AI generated' : 'Real'}. Check it out! #DetectAI #GenerativeAI`;
    const shareUrl = "https://detect-ai.vercel.app";

    const handleCopy = () => {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareSocial = (platform: "twitter" | "linkedin") => {
        const urls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        };
        window.open(urls[platform], "_blank");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-md"
                    >
                        <GlassCard glow={result.verdict === "ai" ? "purple" : "emerald"} className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                                        <Share2 className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white font-display">Share Results</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <p className="text-sm text-gray-300 leading-relaxed italic">
                                        "{shareText}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => shareSocial("twitter")}
                                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white font-medium"
                                    >
                                        <Twitter className="h-4 w-4" />
                                        <span>X (Twitter)</span>
                                    </button>
                                    <button
                                        onClick={() => shareSocial("linkedin")}
                                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white font-medium"
                                    >
                                        <Linkedin className="h-4 w-4" />
                                        <span>LinkedIn</span>
                                    </button>
                                </div>

                                <GlowButton
                                    onClick={handleCopy}
                                    variant="primary"
                                    className="w-full"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            <span>Copied to Clipboard!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            <span>Copy link & text</span>
                                        </>
                                    )}
                                </GlowButton>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
