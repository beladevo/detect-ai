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
    <div ref={containerRef} className="rounded-[2rem] border border-white/10 bg-gray-900/60 p-8 backdrop-blur-2xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h3 className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-xl font-bold text-transparent">
            Scan History
          </h3>
          <p className="mt-1 text-xs uppercase tracking-widest text-gray-500">
            Local Archives
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="group flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs font-medium text-gray-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3 transition-transform group-hover:scale-110" />
            CLEAR LOGS
          </button>
        )}
      </div>

      <div ref={listRef} className="space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400">No scans recorded</p>
            <p className="text-xs text-gray-600">Upload an image to populate history</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="history-item group relative flex items-center justify-between overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 transition-all hover:bg-white/[0.04]"
            >
              <div 
                className="absolute inset-y-0 left-0 w-1 opacity-60" 
                style={{ background: getBorderGradient(item.score) }} 
              />
              
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="truncate text-sm font-medium text-white/90" title={item.fileName}>
                        {item.fileName}
                    </div>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleTimeString("he-IL", { hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString("he-IL")}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                 {/* Type Badge */}
                 <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${item.score > 50 ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {item.score > 50 ? <Cpu className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {item.score > 50 ? 'AI Generated' : 'Human'}
                 </div>

                 {/* Score */}
                <div className="text-right">
                  <div className={`text-xl font-bold ${getScoreColor(item.score)}`}>
                    {item.score}%
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-600">Prob</div>
                </div>
              </div>

              {/* Hover Glow */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
