"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer id="privacy" className="border-t border-white/10 bg-white/5">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-purple-300" />
            EliteB.gg
          </div>
          <p className="mt-3 text-sm text-gray-400">
            Advanced detection delivering full transparency for visual content.
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
          <p>Files are deleted after analysis. No reuse without permission.</p>
          <p className="mt-4 text-xs text-gray-500">
            © 2026 EliteB.gg. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
