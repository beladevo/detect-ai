"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";

type UploadZoneProps = {
  isUploading: boolean;
  onFileSelected: (file: File) => void;
};

export default function UploadZone({ isUploading, onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <label
      className={`group flex h-64 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 text-center transition ${
        isDragging
          ? "border-purple-400/80 bg-purple-500/15"
          : "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60"
      }`}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFile(event.dataTransfer.files);
      }}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files)}
      />

      {isUploading ? (
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-purple-200">
            מנתח נתונים דיגיטליים...
          </p>
          <div className="mt-6 grid w-full gap-3">
            <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload className="mb-4 h-12 w-12 text-purple-400 transition-transform group-hover:scale-110" />
          <p className="text-xl font-semibold">גרור תמונה לכאן</p>
          <p className="mt-2 text-sm text-gray-400">PNG, JPG עד 10MB</p>
          <p className="mt-4 text-xs uppercase tracking-[0.4em] text-gray-500">
            Secure Upload
          </p>
        </div>
      )}
    </label>
  );
}
