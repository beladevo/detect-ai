"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { ArrowRight, Download, Eye, Globe, KeyRound, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

import AuroraBackground from "@/src/components/ui/AuroraBackground";
import GlassCard from "@/src/components/ui/GlassCard";
import GlowButton from "@/src/components/ui/GlowButton";
import { DotPattern } from "@/src/components/ui/DotPattern";
import { cn } from "@/src/lib/utils";
import type { LucideIcon } from "lucide-react";

const stats = [
  { value: "1M+", label: "images scanned daily" },
  { value: "0.3s", label: "average verdict latency" },
  { value: "99.2%", label: "badge confidence" },
];

const featureCards: Array<{
  title: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
}> = [
  {
    title: "Real-time verdicts",
    detail: "Imagion badges float on top of every page, so you spot AI-generated imagery without leaving your tab.",
    icon: Sparkles,
    accent: "from-purple-500/20 to-purple-500/5",
  },
  {
    title: "Privacy-first analysis",
    detail: "Toggle automatic local detection via admin controls and keep image data on your device until you allow cloud fusion.",
    icon: ShieldCheck,
    accent: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    title: "Signals you understand",
    detail: "Hover a badge to see which artifact (visual, metadata, physics, or ML) shaped the verdict, plus confidence and uncertainty.",
    icon: Eye,
    accent: "from-pink-500/20 to-pink-500/5",
  },
  {
    title: "Always-on control",
    detail: "Pin the badge, block noisy hosts, switch plans, and override the endpoint right from the extension options page.",
    icon: KeyRound,
    accent: "from-brand-mint/30 to-brand-mint/10",
  },
];

const usageSteps: Array<{
  title: string;
  detail: string;
  icon: LucideIcon;
}> = [
  {
    title: "Install & pin Imagion",
    detail: "Visit the Chrome Web Store listing, install the extension, and pin it so the badge stays visible while you browse.",
    icon: Download,
  },
  {
    title: "Sign in once",
    detail: "Paste your Imagion API key or sign in via the popup. The credentials live in Chrome storage but never leave your browser.",
    icon: Globe,
  },
  {
    title: "Browse with confidence",
    detail: "Badges annotate every image, link to the dashboard, and call the detection API (or local endpoint) as you hover.",
    icon: Zap,
  },
  {
    title: "Customize & react",
    detail: "Use the admin controls to choose detection mode, toggle alerts, whitelist trusted hosts, and read the badge history.",
    icon: ShieldCheck,
  },
];

const pipelineHighlights: Array<{
  title: string;
  detail: string;
  icon: LucideIcon;
}> = [
  {
    title: "Visual artifacts",
    detail: "Texture, chrominance, and symmetry checks fuel the badge text, so you know exactly why a verdict landed where it did.",
    icon: Eye,
  },
  {
    title: "Metadata & provenance",
    detail: "Exif/IPTC fingerprints and C2PA/CAI signatures provide additional confidence when metadata matches or contradicts the scene.",
    icon: Globe,
  },
  {
    title: "Frequency + physics",
    detail: "FFT grids and shadow/perspective consistency ensure our badges don't just guess—they reason about how the light should behave.",
    icon: Zap,
  },
];

const browserLinks = [
  {
    name: "Chrome Web Store",
    url: "https://chrome.google.com/webstore/search/imagion",
    gradient: "from-purple-500/40 via-pink-500/20 to-cyan-500/30",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <circle cx="12" cy="12" r="11" fill="#4285F4" />
        <path
          d="M6 12a6 6 0 0 1 8.66-5.57L20 12l-5.34 5.57A6 6 0 0 1 6 12z"
          fill="#F4B400"
        />
        <path
          d="M12 6a6 6 0 0 1 0 12l-5.34-5.57L12 6z"
          fill="#34A853"
        />
        <circle cx="16" cy="12" r="2.5" fill="#FFFFFF" opacity="0.8" />
      </svg>
    ),
  },
  {
    name: "Firefox Add-ons",
    url: "https://addons.mozilla.org/firefox/search/?q=imagion",
    gradient: "from-orange-500/30 via-rose-500/20 to-yellow-500/20",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path
          d="M12 2c-1.1 0-2 .9-2 2v4a3 3 0 0 1-3 3H5c-1.1 0-2 .9-2 2a7 7 0 1 0 14 0c0-1.1-.9-2-2-2h-2a3 3 0 0 1-3-3V4c0-1.1-.9-2-2-2z"
          fill="#FF9400"
        />
        <path
          d="M18.5 13c0 3.04-1.7 5.65-4.25 6.8L12 22l-2.25-2.2C7.7 18.65 6 16.04 6 13h12.5z"
          fill="#FF470A"
        />
        <circle cx="12" cy="11" r="2.5" fill="#FEEEBF" />
      </svg>
    ),
  },
  {
    name: "Edge Add-ons",
    url: "https://microsoftedge.microsoft.com/addons/search?query=imagion",
    gradient: "from-cyan-500/40 via-blue-500/20 to-indigo-500/30",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path
          d="M4 12a8 8 0 0 1 8-8h6.5l1 2.2C20.2 8.5 19.4 11 16 11h-4a4 4 0 0 0-4 4v4c0 .4.1.9.4 1.2L8 20h-2a2 2 0 0 1-2-2v-6z"
          fill="#00A4EF"
        />
        <path
          d="M12 4a8 8 0 0 0-8 8h8V4z"
          fill="#106EBE"
        />
        <path
          d="M16 11h-2v6h4c.3 0 .6-.1.9-.3.9-.5 1.1-1.5.6-2.4l-1.5-2.6A10.2 10.2 0 0 0 16 11z"
          fill="#0078D4"
        />
      </svg>
    ),
  },
  {
    name: "Brave via Chrome store",
    url: "https://chrome.google.com/webstore/search/imagion",
    gradient: "from-brand-mint/40 via-cyan-500/20 to-brand-purple/20",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6">
        <path
          d="M12 2c-5.5 0-10 4.5-10 10 0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm0 4c3.2 0 5.7 2.5 5.7 5.5 0 1.2-.4 2.2-1 3.1L15 14c.5-.4.9-1 1-1.5 0-1.7-1.5-3-3.4-3-1.8 0-3.4 1.2-3.4 2.8 0 1.2.8 1.9 1.7 2.3l-2.6 2.6c-1.1-1.2-1.7-2.7-1.7-4.4C6.3 8.5 8.8 6 12 6z"
          fill="#F27D31"
        />
        <circle cx="12" cy="13.5" r="1.5" fill="#F9BC1A" />
      </svg>
    ),
  },
];

const mockScenes = [
  {
    title: "Social media feed",
    detail: "A floating badge details the verdict above a trending post, complete with tooltip animation.",
    accent: "from-purple-500/40 to-transparent",
  },
  {
    title: "News & journalism",
    detail: "Editorial workflows get context--badge highlights metadata insights next to breaking headlines.",
    accent: "from-cyan-500/40 to-transparent",
  },
  {
    title: "Shopping galleries",
    detail: "Marketplace visuals warn about AI-generated promos while shoppers scroll for real reviews.",
    accent: "from-pink-500/40 to-transparent",
  },
];

export default function GetExtensionPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!heroGlowRef.current) return;
      const timeline = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 3, ease: "power1.inOut" } });
      timeline.to(heroGlowRef.current, { x: 8, y: -6, opacity: 0.9 }, 0);
      timeline.to(heroGlowRef.current, { filter: "blur(70px)", scale: 1.1 }, 0);
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleInstall = useCallback(() => {
    window.open("https://chrome.google.com/webstore/search/imagion", "_blank");
  }, []);

  const highlightCopy = useMemo(
    () =>
      "Download the Imagion badge, pin it, and let it travel the web with you. Every badge tells you which signal tipped the scales and how confident the engine is.",
    []
  );

  return (
    <AuroraBackground className="min-h-screen bg-background">
      <div className="relative isolate min-h-screen">
        <div className="absolute inset-0 -z-10 opacity-30" />
        <DotPattern
          className={cn(
            "pointer-events-none absolute inset-0 opacity-20",
            "[mask-image:radial-gradient(600px_at_center,_rgba(255,255,255,0.15),_transparent)]"
          )}
        />
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-24 pt-24 sm:px-6">
          <section ref={heroRef} className="relative z-10">
            <GlassCard glow="purple" className="overflow-hidden rounded-[32px] border border-white/10 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-foreground/60">
                    <span className="h-2 w-2 rounded-full bg-brand-cyan" /> badge-ready
                  </p>
                  <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                      Get the Imagion browser extension
                    </span>
                    <span className="block text-white/80">and surface truth wherever you surf.</span>
                  </h1>
                  <p className="max-w-3xl text-lg text-foreground/70">{highlightCopy}</p>
                  <div className="flex flex-wrap gap-3">
                    <GlowButton onClick={handleInstall} size="lg" className="group" glowColor="#ec4899">
                      Install for Chrome
                      <ArrowRight className="h-4 w-4" />
                    </GlowButton>
                    <GlowButton variant="ghost" size="lg" onClick={() => document.getElementById("usage")?.scrollIntoView({ behavior: "smooth" })}>
                      How to use
                    </GlowButton>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <div
                    ref={heroGlowRef}
                    className="hero-glow absolute inset-0 m-[-1.5rem] rounded-[36px] bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/5 opacity-60 blur-[60px]"
                  />
                  <div className="relative flex h-[260px] w-[260px] items-center justify-center">
                    <div className="absolute inset-0 z-0 rounded-[72px] border border-white/5 bg-white/10 blur-0" />
                    <div className="relative z-10 flex flex-col items-center gap-2 rounded-[46px] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-6 text-center">
                      <span className="text-xs uppercase tracking-[0.4em] text-foreground/50">Badge live</span>
                      <p className="text-3xl font-bold text-white">Live</p>
                      <p className="text-sm text-foreground/60">Every tab, every image</p>
                      <div className="mt-4 text-[10px] uppercase tracking-[0.3em] text-foreground/50">Click for insight</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-2xl font-semibold text-white">{item.value}</p>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-foreground/60">{item.label}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-foreground/60">Why install</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">Badge intelligence that travels with you</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {featureCards.map((feature) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6 }}
                >
                  <GlassCard glow="purple" className="h-full border-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                    <div
                      className={
                        `mb-4 inline-flex items-center justify-center rounded-full border border-white/20 px-3 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-foreground/50 ${feature.accent}`
                      }
                    >
                      <feature.icon className="h-4 w-4" />
                      <span className="ml-2 text-xs">signal</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-foreground/70">{feature.detail}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>

          <section id="usage" className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-foreground/60">How to use</p>
              <h2 className="text-4xl font-semibold text-white">Install, configure, and let Imagion badge the web</h2>
              <p className="max-w-3xl text-base text-foreground/60">
                The extension streams every verdict through the same detection API that powers your dashboard. Choose cloud or local mode, override the endpoint, and share the badge across tabs.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {usageSteps.map((step, index) => (
                <motion.article
                  key={step.title}
                  className="rounded-3xl border border-white/10 bg-black/10 p-6 shadow-xl shadow-brand-purple/40 backdrop-blur-2xl"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5">
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.4em] text-foreground/60">Step {index + 1}</p>
                      <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-foreground/60">{step.detail}</p>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-foreground/60">Behind the badge</p>
              <h2 className="text-3xl font-semibold text-white">The pipeline you trust is the same pipeline that paints the badge.</h2>
              <p className="text-base text-foreground/60">
                The extension defers to the same modular inference pipeline as the control plane. Every signal that reaches the API (visual, metadata, physics, frequency, ML) also powers the badge copy, so your verdict never feels disconnected.
              </p>
              <div className="grid gap-4">
                {pipelineHighlights.map((item) => (
                  <GlassCard key={item.title} glow="cyan" className="border-white/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center gap-3 text-sm text-foreground/70">
                      <item.icon className="h-4 w-4 text-brand-cyan" />
                      {item.title}
                    </div>
                    <p className="mt-2 text-sm text-foreground/70">{item.detail}</p>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-card/80 to-card/50 p-6 shadow-xl shadow-brand-pink/40 backdrop-blur-2xl">
              <div className="flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-foreground/50">Badge preview</p>
                <div className="rounded-2xl border border-white/20 bg-black/30 p-6 text-center">
                  <p className="text-sm text-foreground/60">Imagion badge hovering over a headline with a transparent tooltip.</p>
                  <div className="mt-4 text-lg font-semibold text-white">AI DETECTED</div>
                  <p className="text-xs uppercase tracking-[0.4em] text-foreground/50">Confidence 99.2%</p>
                </div>
                <p className="text-sm text-foreground/60">
                  Tap the badge to reveal module scores, context details, and guidance. The same data syncs to the dashboard, so nothing you read in your browser is kept secret from your analytics layer.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-foreground/60">Scenes in action</p>
              <h2 className="text-3xl font-semibold text-white">Mockups to show how the badge flows through your routine</h2>
              <p className="max-w-3xl text-sm text-foreground/60">
                Every mock scene highlights the badge, tooltip, and context your users will see while surfing social feeds, news, and shopping.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {mockScenes.map((scene) => (
                <div
                  key={scene.title}
                  className="rounded-3xl border border-white/10 bg-card/80 p-6 shadow-xl shadow-brand-purple/20 backdrop-blur-2xl"
                >
                  <div
                    className={`relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${scene.accent} p-4`}
                  >
                    <div className="absolute bottom-4 left-4 right-4 h-12 rounded-2xl bg-white/10 shadow-lg shadow-black/30" />
                    <div className="absolute top-6 left-6 h-3 w-20 rounded-full bg-white/40" />
                    <div className="absolute top-14 left-6 h-4 w-32 rounded-full bg-white/30" />
                    <div className="absolute top-24 left-6 h-4 w-24 rounded-full bg-white/30" />
                    <div className="absolute inset-x-6 top-32 h-2 rounded-full bg-white/20" />
                    <div className="absolute right-6 top-4 rounded-full border border-white/50 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black">
                      AI
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-white">{scene.title}</p>
                  <p className="mt-1 text-xs text-foreground/60">{scene.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-foreground/60">Install places</p>
              <h2 className="text-3xl font-semibold text-white">Get the badge wherever you install browsers</h2>
              <p className="max-w-3xl text-sm text-foreground/60">
                Each store link opens a pre-filtered listing so you can install Imagion on Chrome, Firefox, Edge, or Brave with a single tap.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {browserLinks.map((browser) => (
                <a
                  key={browser.name}
                  href={browser.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex flex-col gap-3 rounded-3xl border border-white/10 bg-gradient-to-br ${browser.gradient} p-5 text-left transition hover:scale-105 hover:border-white/30`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/10">
                    {browser.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{browser.name}</p>
                    <p className="text-xs text-white/70">Open store listing</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-white/80">Install</span>
                </a>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <GlassCard glow="pink" className="border-white/10 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-foreground/60">Ready when you are</p>
              <h2 className="text-3xl font-bold text-white">Bring real-time AI awareness to every tab.</h2>
              <p className="mx-auto max-w-3xl text-sm text-foreground/60">
                Imagion's extension returns on every page you visit. Install once, keep the badge pinned, and trust the same detection engine that powers our dashboard.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <GlowButton size="lg" className="group" glowColor="#8b5cf6" onClick={handleInstall}>
                  Install the extension
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
                <GlowButton size="lg" variant="secondary" onClick={() => document.getElementById("usage")?.scrollIntoView({ behavior: "smooth" })}>
                  Learn how it works
                </GlowButton>
              </div>
            </GlassCard>
          </section>
        </main>
      </div>
    </AuroraBackground>
  );
}
