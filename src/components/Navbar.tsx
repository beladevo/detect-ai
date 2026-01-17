"use client";

import React from "react";
import Image from "next/image";

type NavbarProps = {
  onActionClick: () => void;
};

export default function Navbar({ onActionClick }: NavbarProps) {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Image
            src="/logo.png"
            alt="DetectAI Logo"
            width={36}
            height={36}
            className="rounded-xl"
          />
          <span className="font-display text-xl">AI-human detector</span>
        </div>
        <div className="hidden items-center gap-6 text-sm text-gray-300 md:flex">
          <a href="#upload" className="transition hover:text-white">
            Detection
          </a>
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#waitlist" className="transition hover:text-white">
            Coming Soon
          </a>
          <a href="#privacy" className="transition hover:text-white">
            Privacy
          </a>
        </div>
        <button
          onClick={onActionClick}
          className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:border-purple-400/40 hover:bg-purple-500/20"
        >
          Start Scan
        </button>
      </div>
    </nav>
  );
}
