"use client";

import Link from "next/link";
import React from "react";
import { Lock, ShieldCheck, ServerOff } from "lucide-react";

const highlights = [
  {
    icon: ServerOff,
    title: "Local-first detection",
    description:
      "Browser-based detection keeps files on your device. Only derived scores, hashes, and metadata are sent when the cloud API is needed.",
  },
  {
    icon: ShieldCheck,
    title: "Clear history anytime",
    description:
      "Result summaries live in your browser. Undo them via the history list or sign out to clear session-bound data.",
  },
  {
    icon: Lock,
    title: "Data-savvy by design",
    description:
      "We cache only non-image payloads and avoid tracking pixels or commercial telemetry.",
  },
];

export default function PrivacySection() {
  return (
    <section id="privacy" className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20">
      <div className="rounded-[32px] border border-border bg-card/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-foreground/60">
              Privacy
            </p>
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              Your images stay under your control.
            </h2>
            <p className="mt-4 text-sm text-foreground/60">
              We default to local detection inside your browser. When the UI
              transparently falls back to the cloud API or you call it directly,
              we upload the file, compute a SHA-256 digest, and keep only the
              derived verdict metadata. The raw pixels never persist, and we
              never sell or trade your images.
            </p>
            <p className="mt-2 text-xs text-foreground/50">
              Learn how API logging, caching, and the extension&apos;s detection modes
              work on the{" "}
              <Link
                href="/privacy"
                className="font-semibold text-brand-cyan underline decoration-brand-cyan/60"
              >
                privacy page
              </Link>
              .
            </p>
          </div>
          <div className="grid gap-4 text-sm text-foreground/60">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-card/20 px-4 py-3"
                >
                  <div className="flex items-center gap-3 text-foreground">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card/40">
                      <Icon className="h-4 w-4 text-brand-mint" />
                    </span>
                    <span className="font-semibold">{item.title}</span>
                  </div>
                  <p className="mt-2 text-xs text-foreground/50">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
