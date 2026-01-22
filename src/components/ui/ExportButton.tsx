"use client";

import React from "react";
import { Download, FileJson, FileText } from "lucide-react";
import type { PipelineResult } from "@/src/lib/pipeline/types";
import { prepareExportData, exportAsJSON, exportAsText } from "@/src/lib/exportReport";

interface ExportButtonProps {
  pipeline: PipelineResult;
  fileName?: string;
  variant?: "json" | "text" | "both";
}

export default function ExportButton({
  pipeline,
  fileName,
  variant = "both",
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleExportJSON = () => {
    const data = prepareExportData(pipeline, fileName);
    exportAsJSON(data, fileName);
    setIsOpen(false);
  };

  const handleExportText = () => {
    const data = prepareExportData(pipeline, fileName);
    exportAsText(data, fileName);
    setIsOpen(false);
  };

  if (variant === "json") {
    return (
      <button
        onClick={handleExportJSON}
        className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-all hover:border-white/30 hover:bg-white/10"
      >
        <FileJson className="h-4 w-4" />
        Export JSON
      </button>
    );
  }

  if (variant === "text") {
    return (
      <button
        onClick={handleExportText}
        className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-all hover:border-white/30 hover:bg-white/10"
      >
        <FileText className="h-4 w-4" />
        Export TXT
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-all hover:border-white/30 hover:bg-white/10"
      >
        <Download className="h-4 w-4" />
        Export Report
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-white/20 bg-gray-900 shadow-xl">
            <button
              onClick={handleExportJSON}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-200 transition-colors hover:bg-white/5"
            >
              <FileJson className="h-4 w-4 text-blue-400" />
              <div>
                <div className="font-medium">JSON</div>
                <div className="text-xs text-gray-500">Machine-readable</div>
              </div>
            </button>

            <div className="border-t border-white/10" />

            <button
              onClick={handleExportText}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-200 transition-colors hover:bg-white/5"
            >
              <FileText className="h-4 w-4 text-green-400" />
              <div>
                <div className="font-medium">Text Report</div>
                <div className="text-xs text-gray-500">Human-readable</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
