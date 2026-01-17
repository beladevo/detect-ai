"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Mail, Rocket } from "lucide-react";

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

  return (
    <section
      id="waitlist"
      className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16 pt-6"
    >
      <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 via-purple-500/10 to-cyan-500/10 p-8 shadow-2xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-300">
              Coming soon
            </p>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Server-powered AI detection for your team.
            </h2>
            <p className="mt-4 text-sm text-gray-300">
              Send images to our servers and get a clear score back in seconds.
              No setup, no heavy computing on your device.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-gray-300">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Rocket className="mt-1 h-4 w-4 text-cyan-200" />
                <span>Built for teams and platforms that need reliable results.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Mail className="mt-1 h-4 w-4 text-purple-200" />
                <span>Always improving. You get the newest model automatically.</span>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-200" />
                <span>Simple results you can explain to non-technical stakeholders.</span>
              </div>
            </div>
            <div className="mt-6 text-xs text-gray-400">
              How it works: You send the image {"->"} We analyze it {"->"} You get a clear
              score.
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Local detection stays available for privacy-focused workflows.
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-purple-500/15 blur-2xl" />
            <div className="relative rounded-3xl border border-white/10 bg-black/50 p-6">
              <h3 className="text-lg font-semibold text-white">Join the waitlist</h3>
              <p className="mt-2 text-sm text-gray-300">
                Be first to know when the server API opens. We only email for launch updates.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
                <label className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-purple-300 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-purple-100 disabled:cursor-not-allowed"
                >
                  {state === "loading" ? "Submitting..." : "Join the waitlist"}
                  <ArrowRight className="h-4 w-4" />
                </button>
                {message ? (
                  <p
                    className={`text-xs ${
                      state === "success" ? "text-emerald-200" : "text-red-200"
                    }`}
                  >
                    {message}
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
