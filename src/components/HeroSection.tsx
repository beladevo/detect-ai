"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ShieldCheck } from "lucide-react";

type HeroSectionProps = {
  onCTA: () => void;
};

export default function HeroSection({ onCTA }: HeroSectionProps) {
  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-12 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-purple-500/10 p-10 shadow-2xl"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-300">
              <ShieldCheck className="h-4 w-4 text-purple-300" />
              Elite Detection Grid
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Advanced AI Image Detection with forensic-grade confidence.
            </h1>
            <p className="mt-4 text-lg text-gray-300">
              העלה תמונה וקבל דוח מיידי שמראה כמה היא נוצרה על ידי AI, כולל
              סריקת חתימות ויזואליות ומפת חום מתקדמת.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={onCTA}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-purple-100"
              >
                Start Detection
                <ArrowDownRight className="h-4 w-4" />
              </button>
              <div className="text-sm text-gray-400">
                זמן ממוצע לתוצאה: 2 שניות • ללא שמירת קבצים
              </div>
            </div>
          </div>
          <div className="grid gap-4 text-sm text-gray-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                Threat Score
              </p>
              <p className="mt-2 text-3xl font-semibold text-white">87%</p>
              <p className="mt-1 text-gray-400">AI likelihood detected</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                Trust Layer
              </p>
              <p className="mt-2 text-lg font-semibold text-emerald-200">
                Zero Retention
              </p>
              <p className="mt-1 text-gray-400">
                בדיקות נשמרות מקומית בלבד.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
