"use client";

import React from "react";
import { Lock, ServerOff, ShieldCheck } from "lucide-react";

const highlights = [
  {
    icon: ServerOff,
    title: "No uploads",
    description: "Images never leave your device while detection runs locally.",
  },
  {
    icon: ShieldCheck,
    title: "Clear history anytime",
    description: "Stored results live in your browser and can be wiped instantly.",
  },
  {
    icon: Lock,
    title: "Private by design",
    description: "No tracking pixels, no hidden logging, no file retention.",
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
              Your images stay yours.
            </h2>
            <p className="mt-4 text-sm text-foreground/60">
              AI-human detector runs a{" "}
              <strong className="font-semibold text-foreground">
                local AI detection model
              </strong>{" "}
              so sensitive files never hit a server. We do not store uploads or
              sell any data.
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
