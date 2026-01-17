"use client";

import React from "react";
import { Clock } from "lucide-react";

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
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Recent scans</h3>
          <p className="text-sm text-gray-400">Stored locally in your browser.</p>
        </div>
        {items.length > 0 ? (
          <button
            onClick={onClear}
            className="text-xs uppercase tracking-[0.3em] text-gray-400 transition hover:text-white"
          >
            Clear
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
          No scans yet. Upload an image to get started.
        </div>
      ) : (
        <div className="mt-6 space-y-3 text-sm text-gray-300">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white" title={item.fileName}>{item.fileName}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleString("he-IL")}
                </div>
              </div>
              <div className="ml-4 shrink-0 text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  AI
                </p>
                <p className="text-lg font-semibold text-purple-200">
                  {item.score}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
