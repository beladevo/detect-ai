"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Upload } from "lucide-react";

type UploadZoneProps = {
  isUploading: boolean;
  onFileSelected: (file: File) => void;
};

export default function UploadZone({ isUploading, onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLLabelElement>(null);
  const iconRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const stampRef = useRef<HTMLParagraphElement>(null);
  const idleTweenRef = useRef<gsap.core.Tween | null>(null);

  const handleFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.to(containerRef.current, {
      scale: isDragging ? 1.02 : 1,
      y: isDragging ? -2 : 0,
      boxShadow: isDragging ? "0 30px 80px rgba(147, 51, 234, 0.25)" : "0 0 0 rgba(0, 0, 0, 0)",
      duration: isDragging ? 0.2 : 0.35,
      ease: "power3.out",
    });
  }, [isDragging]);

  useEffect(() => {
    idleTweenRef.current?.kill();
    idleTweenRef.current = null;
    if (isUploading) return;
    if (!iconRef.current) return;

    const ctx = gsap.context(() => {
      const nodes = [iconRef.current, titleRef.current, subRef.current, stampRef.current].filter(
        (node): node is SVGSVGElement | HTMLParagraphElement => Boolean(node)
      );
      gsap.fromTo(
        nodes,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08 }
      );
      idleTweenRef.current = gsap.to(iconRef.current, {
        y: -6,
        duration: 1.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isUploading]);

  return (
    <label
      ref={containerRef}
      className={`group flex h-64 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 text-center transition ${isDragging
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
            Analyzing digital artifacts...
          </p>
          <div className="mt-6 grid w-full gap-3">
            <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload
            ref={iconRef}
            className="mb-4 h-12 w-12 text-purple-400 transition-transform group-hover:scale-110"
          />
          <p ref={titleRef} className="text-xl font-semibold">
            Drag an image here
          </p>
          <p ref={subRef} className="mt-2 text-sm text-gray-400">
            PNG, JPG up to 10MB
          </p>
          <p ref={stampRef} className="mt-4 text-xs uppercase tracking-[0.4em] text-gray-500">
            Secure Upload
          </p>
        </div>
      )}
    </label>
  );
}
