import Link from "next/link";
import type { Metadata } from "next";
import { Database, Lock, Radar, Server, ShieldCheck } from "lucide-react";
import Footer from "@/src/components/Footer";
import Navbar from "@/src/components/Navbar";
import GlassCard from "@/src/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Privacy & Data Handling | Imagion",
  description:
    "Imagion does not keep raw images on its servers. Read how we handle detection metadata, caching, and the difference between local and API scans.",
};

const dataCollection = [
  {
    icon: ShieldCheck,
    title: "Account basics",
    detail:
      "We keep your email, password hash, plan status, and payment metadata so you can sign in and manage billing without us ever seeing your actual password.",
  },
  {
    icon: Database,
    title: "Detection summaries",
    detail:
      "Each scan record stores the verdict, confidence, model name, processing time, and a few hashes so repeat checks show up instantly. The original picture never leaves your device unless you explicitly upload it.",
  },
  {
    icon: Server,
    title: "Performance helpers",
    detail:
      "Caches and usage logs help the service stay fast and fair. They record only derived metadata and request status so we can enforce limits and spot abuse without exposing personal files.",
  },
  {
    icon: Lock,
    title: "Local control",
    detail:
      "The recent-scan list is stored in your browser storage and can be cleared with the \"Clear history\" button. Anything labeled local keeps pixels on your device unless you choose to share.",
  },
];

const detectionFlows = [
  {
    title: "Local detection (default on the website)",
    icon: ShieldCheck,
    accent: "purple",
    bullets: [
      "Runs inside your browser so the pixels never leave your device unless you explicitly upload them.",
      "We keep only the verdict, score, and a few hashes when you let us save your history; nothing more is shared.",
      "The Chrome extension offers the same experience, and you can point it at your own server for extra peace of mind.",
    ],
  },
  {
    title: "Cloud-assisted detection",
    icon: Server,
    accent: "cyan",
    bullets: [
      "Uploads go through a validation step before analysis, but only cloud-derived summaries ever reach our servers.",
      "Caches make repeat scans faster, and usage logs (status, timestamp, IP) help keep the service reliable without keeping images.",
      "Everything is internal to our ops team—these logs exist for rate limiting and diagnostics, not for advertising or sharing.",
    ],
  },
];

const retentionNotes = [
  "We do not save your pictures on our servers. Only a few hashed metadata points stick around so we can spot duplicates and keep caches warm.",
  "Cached entries refresh after each scan, so older ones naturally fall away as they are reprocessed.",
  "Usage logs exist only for rate limiting and diagnostics; they never contain personal files.",
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 pb-16 text-foreground">
      <Navbar />
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 pt-32 pb-12">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">Security & Privacy</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Privacy you can audit.
          </h1>
          <p className="text-sm text-foreground/70">
            At this moment we do not save images on our servers. Imagion keeps the
            detection pipeline visible: local scans stay in your browser, and API
            scans only persist hashes and verdict metadata for caching, billing, and
            customer history.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white hover:bg-white/10"
            >
              Back to home
            </Link>
            <Link
              href="/#upload"
              className="inline-flex items-center rounded-2xl border border-border bg-card/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground transition hover:border-white/40"
            >
              Start detection
            </Link>
          </div>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          {dataCollection.map((item) => {
            const Icon = item.icon;
            return (
              <GlassCard key={item.title} className="p-6" glow="cyan">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-brand-cyan" />
                  <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                </div>
                <p className="mt-3 text-sm text-foreground/70">{item.detail}</p>
              </GlassCard>
            );
          })}
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">Detection flows</p>
            <h2 className="font-display text-3xl font-semibold text-white">How local and API scans differ</h2>
            <p className="text-sm text-foreground/60">
              Both approaches use the same detection engine. The table below shows how the data travels when you stay local versus when you lean on the cloud helpers.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {detectionFlows.map((flow) => {
              const FlowIcon = flow.icon;
              return (
                <GlassCard
                  key={flow.title}
                  className="p-6"
                  glow={flow.accent as "purple" | "cyan" | "pink"}
                  variant="glowing"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FlowIcon className="h-6 w-6 text-white" />
                      <h3 className="text-xl font-semibold text-white">{flow.title}</h3>
                    </div>
                  </div>
                  <ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-foreground/70">
                    {flow.bullets.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </GlassCard>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Radar className="h-5 w-5 text-brand-purple" />
            <h3 className="text-lg font-semibold text-white">Retention & security posture</h3>
          </div>
          <GlassCard className="p-6" glow="purple">
            <ul className="list-inside list-disc space-y-2 text-sm text-foreground/70">
              {retentionNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </GlassCard>
        </section>
      </main>

      <Footer />
    </div>
  );
}
