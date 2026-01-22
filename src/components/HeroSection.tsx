"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDownRight, Bot, ShieldCheck, Sparkles, Zap } from "lucide-react";
import GlowButton from "./ui/GlowButton";
import GlassCard from "./ui/GlassCard";

type HeroSectionProps = {
  onCTA: () => void;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export default function HeroSection({ onCTA }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax effect for the hero section
      gsap.to(heroRef.current, {
        y: -40,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Logo rotation on scroll
      if (logoRef.current) {
        gsap.to(logoRef.current, {
          rotate: 180,
          ease: "none",
          transformOrigin: "50% 50%",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const titleWords = "Expose AI-generated images. Reveal the truth.".split(" ");

  return (
    <section ref={heroRef} className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute -left-[15%] top-[5%] h-[500px] w-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, var(--brand-purple) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute -right-[10%] top-[20%] h-[400px] w-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, var(--brand-cyan) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(var(--foreground) 1px, transparent 1px),
              linear-gradient(90deg, var(--foreground) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <GlassCard hover={false} className="p-8 sm:p-12">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          {/* Left Content */}
          <motion.div
            className="max-w-2xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-gradient-to-r from-brand-purple/10 to-brand-cyan/10 px-4 py-2 backdrop-blur-sm">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-brand-purple/40" />
                  <Bot className="relative h-4 w-4 text-brand-purple" />
                </div>
                <span className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/70">
                  Imagion AI Detection
                </span>
              </div>
            </motion.div>

            {/* Title with animated words */}
            <motion.h1
              variants={itemVariants}
              className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            >
              {titleWords.map((word, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  className="inline-block pr-3"
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + index * 0.05,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  {word === "AI-generated" ? (
                    <span style={{ color: "var(--brand-purple)" }}>{word}</span>
                  ) : word === "truth." ? (
                    <span style={{ color: "var(--brand-cyan)" }}>{word}</span>
                  ) : (
                    <span className="text-foreground">{word}</span>
                  )}
                </motion.span>
              ))}
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg leading-relaxed text-foreground/60"
            >
              Like a polygraph for images — upload any photo and{" "}
              <span className="text-foreground">instantly detect</span> if it was created by AI.
              Uncover synthetic content with forensic-grade analysis.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-4">
              <GlowButton onClick={onCTA} size="lg">
                <span>Expose the Truth</span>
                <ArrowDownRight className="h-4 w-4" />
              </GlowButton>

              <GlowButton variant="secondary" size="lg" onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}>
                Join Waitlist
              </GlowButton>
            </motion.div>

            {/* Features Pills */}
            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-wrap gap-3"
            >
              {[
                { icon: Zap, label: "1.6s avg response" },
                { icon: ShieldCheck, label: "100% local processing" },
                { icon: Sparkles, label: "Free to use" },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400"
                >
                  <feature.icon className="h-3 w-3 text-purple-400" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Logo & Stats */}
          <motion.div
            className="flex flex-col items-center gap-6 lg:items-end"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Logo with glow */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)",
                  filter: "blur(40px)",
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              <motion.img
                ref={logoRef}
                src="/logo-350.png"
                alt="AI Detector logo"
                width={280}
                height={280}
                className="relative w-40 max-w-full drop-shadow-[0_20px_50px_rgba(139,92,246,0.4)] sm:w-52 lg:w-64"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              />
            </div>

            {/* Stats Cards */}
            <div className="grid w-full gap-4 sm:w-auto">
              <motion.div
                className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card/40 to-brand-purple/10 p-5 backdrop-blur-xl"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/50">
                  Detection Score
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">87</span>
                  <span className="text-xl font-semibold text-brand-purple">%</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-pink"
                    initial={{ width: 0 }}
                    animate={{ width: "87%" }}
                    transition={{ duration: 1, delay: 0.8 }}
                  />
                </div>
                <p className="mt-2 text-xs text-foreground/50">AI likelihood detected</p>
              </motion.div>

              <motion.div
                className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card/40 to-brand-emerald-500/10 p-5 backdrop-blur-xl dark:to-emerald-500/10"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/50">
                  Privacy Status
                </p>
                <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  Zero Retention
                </p>
                <p className="mt-1 text-xs text-foreground/50">
                  All scans processed locally on your device
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </GlassCard>
    </section>
  );
}
