"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-white/5">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-purple-300" />
            DetectAI
          </div>
          <p className="mt-3 text-sm text-gray-400">
            Forensic AI detection with privacy-first, on-device processing.
          </p>
        </div>
        <div className="text-sm text-gray-400">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gray-500">
            Essential
          </p>
          <div className="space-y-2">
            <a href="#upload" className="block transition hover:text-white">
              Upload Detector
            </a>
            <a href="#features" className="block transition hover:text-white">
              Features
            </a>
            <a href="#privacy" className="block transition hover:text-white">
              Privacy
            </a>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gray-500">
            Privacy
          </p>
          <p>Local scans only. You control what gets stored or cleared.</p>
          <p className="mt-4 text-xs text-gray-500">
            (c) 2026 DetectAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


