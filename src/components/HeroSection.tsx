"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDownRight, ShieldCheck } from "lucide-react";

type HeroSectionProps = {
  onCTA: () => void;
};

export default function HeroSection({ onCTA }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(heroRef.current, {
        opacity: 0,
        y: 18,
        duration: 0.6,
        ease: "power2.out",
      });

      gsap.from(
        [badgeRef.current, titleRef.current, bodyRef.current, ctaRef.current, metricsRef.current],
        {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.to(heroRef.current, {
        y: -30,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-12 pt-12">
      <div
        ref={heroRef}
        className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-purple-500/10 p-10 shadow-2xl"
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p
              ref={badgeRef}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-300"
            >
              <ShieldCheck className="h-4 w-4 text-purple-300" />
              Elite Detection Grid
            </p>
            <h1
              ref={titleRef}
              className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl"
            >
              Advanced AI Image Detection with forensic-grade confidence.
            </h1>
            <p ref={bodyRef} className="mt-4 text-lg text-gray-300">
              Upload an image and get an instant report on how likely it is AI-generated,
              including signature analysis and an advanced heatmap.
            </p>
            <div ref={ctaRef} className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={onCTA}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-purple-100"
              >
                Start Detection
                <ArrowDownRight className="h-4 w-4" />
              </button>
              <div className="text-sm text-gray-400">
                Average time to result: 2 seconds • no file retention
              </div>
            </div>
          </div>
          <div ref={metricsRef} className="grid gap-4 text-sm text-gray-300">
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
                Scans are stored locally only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
