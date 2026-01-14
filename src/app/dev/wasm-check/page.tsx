"use client";

import React, { useState } from "react";
import { analyzeImageWithWasm } from "@/src/lib/wasmDetector";

export default function WAsmCheckPage() {
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsRunning(true);
    setError(null);
    setScore(null);

    try {
      const nextScore = await analyzeImageWithWasm(file);
      setScore(nextScore);
    } catch {
      setError("WASM detection failed.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-2xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            Local Debug
          </p>
          <h1 className="mt-2 text-3xl font-semibold">WASM Detector Check</h1>
          <p className="mt-3 text-sm text-gray-300">
            Upload a file to run the browser-based WASM model. Use this for local
            comparisons only.
          </p>
        </div>
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="block w-full rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-gray-200"
          />
          {isRunning ? (
            <p className="text-sm text-gray-400">Running detection...</p>
          ) : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {score !== null ? (
            <p className="text-sm text-gray-200">
              Score:{" "}
              <span data-testid="score" className="font-semibold text-white">
                {score}
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">
              Score: <span data-testid="score">-</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
