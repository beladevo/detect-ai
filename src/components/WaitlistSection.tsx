"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Mail, Rocket, Sparkles, Zap } from "lucide-react";
import GlassCard from "./ui/GlassCard";
import GlowButton from "./ui/GlowButton";

type FormState = "idle" | "loading" | "success" | "error";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "site-waitlist" }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Please try again.");
      }

      setState("success");
      setMessage("Thanks! You are on the waitlist.");
      setEmail("");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  };

  const benefits = [
    {
      icon: Rocket,
      text: "Built for teams and platforms that need reliable results.",
      color: "text-cyan-400",
    },
    {
      icon: Zap,
      text: "Always improving. You get the newest model automatically.",
      color: "text-purple-400",
    },
    {
      icon: CheckCircle2,
      text: "Simple results you can explain to non-technical stakeholders.",
      color: "text-emerald-400",
    },
  ];

  return (
    <section
      id="waitlist"
      className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6"
    >
      <GlassCard hover={false} glow="purple" className="p-8 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-gradient-to-r from-brand-purple/10 to-brand-pink/10 px-4 py-2 backdrop-blur-sm dark:from-purple-500/10 dark:to-pink-500/10">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-brand-purple/40" />
                <Sparkles className="relative h-4 w-4 text-brand-purple" />
              </div>
              <span className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/60">
                Coming Soon
              </span>
            </div>

            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              <span className="text-foreground">Server-powered </span>
              <span className="bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan bg-clip-text text-transparent dark:from-purple-400 dark:via-pink-400 dark:to-cyan-400">
                AI detection
              </span>
              <span className="text-foreground"> for your team</span>
            </h2>

            <p className="mt-4 text-gray-400">
              Send images to our servers and get a clear score back in seconds.
              No setup, no heavy computing on your device.
            </p>

            {/* Benefits */}
            <div className="mt-8 space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card/40 p-4 transition-all duration-300 hover:border-border/60 hover:bg-card/60"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card/40 ${benefit.color}`}>
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm text-foreground/70">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            <p className="mt-6 text-xs text-foreground/40">
              How it works: You send the image → We analyze it → You get a clear score.
            </p>
            <p className="mt-2 text-xs text-foreground/50">
              Local detection stays available for privacy-focused workflows.
            </p>
          </motion.div>

          {/* Right Content - Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-brand-purple/20 via-brand-pink/10 to-brand-cyan/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card/80 via-card/40 to-brand-purple/10 p-8 backdrop-blur-xl dark:bg-panel">
              {/* Glass shine */}
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-purple/30 bg-brand-purple/10">
                    <Mail className="h-6 w-6 text-brand-purple" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Join the Waitlist</h3>
                    <p className="text-xs text-foreground/50">Get early access to the API</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-foreground/60">
                  Be first to know when the server API opens. We only email for launch updates.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.25em] text-foreground/40">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-xl border border-border bg-card/40 px-4 py-3.5 text-foreground placeholder:text-foreground/30 transition-all duration-300 focus:border-brand-purple/50 focus:bg-card/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-brand-purple/0 via-brand-purple/5 to-brand-pink/0 opacity-0 transition-opacity duration-300 focus-within:opacity-100" />
                    </div>
                  </div>

                  <GlowButton
                    type="submit"
                    disabled={state === "loading"}
                    className="w-full"
                    size="lg"
                  >
                    {state === "loading" ? (
                      <>
                        <motion.div
                          className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Join the Waitlist</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </GlowButton>

                  {/* Status message */}
                  <AnimatePresence>
                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${state === "success"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                          }`}
                      >
                        {state === "success" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <span className="h-4 w-4 text-center">!</span>
                        )}
                        {message}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>

                <p className="mt-4 text-center text-xs text-foreground/40">
                  No spam, ever. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </GlassCard>
    </section>
  );
}
