"use client";

import React, { useEffect, useRef } from "react";
import { Clock, Trash2, Cpu, User } from "lucide-react";
import { gsap } from "gsap";

export type HistoryItem = {
  id: string;
  fileName: string;
  score: number;
  createdAt: string;
};

type HistoryListProps = {
  items: HistoryItem[];
  onClear: () => void;
};

export default function HistoryList({ items, onClear }: HistoryListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current || items.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".history-item",
        { opacity: 0, x: -20, rotateX: 10 },
        {
          opacity: 1,
          x: 0,
          rotateX: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
        }
      );
    }, listRef);

    return () => ctx.revert();
  }, [items]);

  useEffect(() => {
    if(!containerRef.current) return;
    const ctx = gsap.context(() => {
        gsap.fromTo(containerRef.current, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.2 }
        )
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const getScoreColor = (score: number) => {
    if (score > 80) return "text-purple-400";
    if (score > 50) return "text-yellow-400";
    return "text-emerald-400";
  };

  const getBorderGradient = (score: number) => {
     if (score > 80) return "linear-gradient(90deg, rgba(168,85,247,0.4), transparent)"; // Purple
     if (score > 50) return "linear-gradient(90deg, rgba(234,179,8,0.4), transparent)";  // Yellow
     return "linear-gradient(90deg, rgba(52,211,153,0.4), transparent)"; // Emerald
  };

  return (
    <div ref={containerRef} className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 backdrop-blur-2xl overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-base font-bold text-transparent">
            Scan History
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-gray-500">
            Local Archives
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="group flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-medium text-gray-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-2.5 w-2.5 transition-transform group-hover:scale-110" />
            CLEAR
          </button>
        )}
      </div>

      <div ref={listRef} className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <p className="text-xs font-medium text-gray-400">No scans recorded</p>
            <p className="text-[10px] text-gray-600">Upload an image to populate history</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="history-item group relative flex items-center justify-between overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-all hover:bg-white/[0.04]"
            >
              <div
                className="absolute inset-y-0 left-0 w-0.5 opacity-60"
                style={{ background: getBorderGradient(item.score) }}
              />

              <div className="flex-1 overflow-hidden min-w-0">
                <div className="truncate text-xs font-medium text-white/90" title={item.fileName}>
                  {item.fileName}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(item.createdAt).toLocaleTimeString("he-IL", { hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString("he-IL")}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-2">
                 <div className={`hidden sm:flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${item.score > 50 ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {item.score > 50 ? <Cpu className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                    {item.score > 50 ? 'AI' : 'Human'}
                 </div>

                <div className="text-right">
                  <div className={`text-sm font-bold ${getScoreColor(item.score)}`}>
                    {item.score}%
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
