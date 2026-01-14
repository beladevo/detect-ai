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
  const bgOneRef = useRef<HTMLDivElement>(null);
  const bgTwoRef = useRef<HTMLDivElement>(null);
  const bgGridRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaButtonRef = useRef<HTMLButtonElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(heroRef);

      gsap.from(heroRef.current, {
        opacity: 0,
        y: 18,
        duration: 0.6,
        ease: "power2.out",
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top 85%",
          once: true,
        },
      });

      tl.from(badgeRef.current, {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: "power2.out",
      })
        .from(
          q(".hero-word"),
          {
            opacity: 0,
            y: 24,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.04,
          },
          "-=0.2"
        )
        .from(
          q(".hero-line"),
          {
            opacity: 0,
            y: 18,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.08,
          },
          "-=0.3"
        )
        .from(
          ctaRef.current,
          {
            opacity: 0,
            y: 18,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.2"
        )
        .from(
          metricsRef.current,
          {
            opacity: 0,
            y: 18,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.1"
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

      if (bgOneRef.current) {
        gsap.to(bgOneRef.current, {
          y: -120,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      if (bgTwoRef.current) {
        gsap.to(bgTwoRef.current, {
          y: -80,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      if (bgGridRef.current) {
        gsap.to(bgGridRef.current, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      if (ctaButtonRef.current) {
        gsap.to(ctaButtonRef.current, {
          y: -8,
          duration: 1.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-12 pt-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          ref={bgOneRef}
          className="absolute left-[-6%] top-[-20%] h-56 w-56 rounded-full bg-purple-600/30 blur-[90px]"
        />
        <div
          ref={bgTwoRef}
          className="absolute right-[-4%] top-[10%] h-64 w-64 rounded-full bg-cyan-500/20 blur-[110px]"
        />
        <div
          ref={bgGridRef}
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50"
        />
      </div>
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
              DetectAI Local Grid
            </p>
            <h1
              ref={titleRef}
              className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl"
            >
              {"DetectAI spots synthetic images with forensic-grade confidence."
                .split(" ")
                .map((word, index) => (
                  <span key={`${word}-${index}`} className="hero-word inline-block pr-2">
                    {word}
                  </span>
                ))}
            </h1>
            <p ref={bodyRef} className="mt-4 text-lg text-gray-300">
              <span className="hero-line block">
                Upload an image and get an instant report on how likely it is AI-generated,
              </span>
              <span className="hero-line block">
                including signature analysis and an advanced heatmap.
              </span>
            </p>
            <div ref={ctaRef} className="mt-8 flex flex-wrap items-center gap-4">
              <button
                ref={ctaButtonRef}
                onClick={onCTA}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-purple-100"
              >
                Start Detection
                <ArrowDownRight className="h-4 w-4" />
              </button>
              <div className="text-sm text-gray-400">
                Average time to result: 1.6 seconds | <strong className="font-semibold text-white">local model on your device</strong> | free to use (currently)
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




