"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Upload, Sparkles, Shield, Zap } from "lucide-react";

type UploadZoneProps = {
  isUploading: boolean;
  onFileSelected: (file: File) => void;
};

export default function UploadZone({ isUploading, onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLLabelElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const scanlineRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (file) onFileSelected(file);
  };



  const handleMouseMove = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (!containerRef.current || !contentRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    gsap.to(contentRef.current, {
      rotateX: rotateX,
      rotateY: rotateY,
      duration: 0.5,
      ease: "power2.out",
      transformPerspective: 1000,
    });

    gsap.to(glowRef.current, {
      x: x - rect.width / 2,
      y: y - rect.height / 2,
      duration: 0.8,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!contentRef.current) return;
    gsap.to(contentRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)",
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 1, ease: "power3.out" }
      );

      gsap.to(borderRef.current, {
        backgroundPosition: "200% center",
        duration: 4,
        repeat: -1,
        ease: "none",
      });

      if (!isUploading) {
        gsap.to(scanlineRef.current, {
          y: "300px",
          opacity: 0,
          duration: 3,
          repeat: -1,
          ease: "linear",
          stagger: {
            each: 0.5,
            repeat: -1
          }
        });
      }

    }, containerRef);

    return () => ctx.revert();
  }, [isUploading]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isDragging) {
        gsap.to(containerRef.current, {
          scale: 1.02,
          boxShadow: "0 0 50px rgba(168, 85, 247, 0.4)",
          duration: 0.4,
          ease: "back.out(1.7)",
        });
        gsap.to(particlesRef.current, {
          opacity: 1,
          duration: 0.3
        });
      } else {
        gsap.to(containerRef.current, {
          scale: 1,
          boxShadow: "0 0 0px rgba(0,0,0,0)",
          duration: 0.4,
          ease: "power2.out",
        });
        gsap.to(particlesRef.current, {
          opacity: 0,
          duration: 0.3
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [isDragging]);

  return (
    <label
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setIsDragging(false);
        handleMouseLeave();
      }}
      onDragEnter={() => setIsDragging(true)}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files);
      }}
      className="group relative flex h-80 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-card/40 backdrop-blur-2xl transition-colors duration-500 hover:bg-card/60"
    >
      <div
        className="absolute inset-0 rounded-[2rem] p-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent, var(--brand-purple), transparent)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
        }}
      >
        <div ref={borderRef} className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-purple to-transparent opacity-50 bg-[length:200%_auto]" />
      </div>

      <div ref={contentRef} className="relative z-10 flex flex-col items-center p-10 text-center">

        <div
          ref={glowRef}
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[80px]"
        />

        <div
          ref={scanlineRef}
          className="pointer-events-none absolute -top-10 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-brand-cyan/50 to-transparent blur-md bg-opacity-20"
        />

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="h-20 w-20 animate-[spin_3s_linear_infinite] rounded-full border-2 border-brand-purple/30 border-t-brand-purple" />
              <div className="absolute inset-0 m-auto h-14 w-14 animate-[spin_2s_linear_infinite_reverse] rounded-full border-2 border-brand-cyan/30 border-b-brand-cyan" />
              <Zap className="absolute inset-0 m-auto h-6 w-6 animate-pulse text-foreground dark:text-white" />
            </div>
            <div>
              <h3 className="bg-gradient-to-r from-foreground to-brand-purple bg-clip-text text-xl font-bold text-transparent">
                Neural Scan Active
              </h3>
              <p className="text-sm text-brand-purple/80 animate-pulse mt-1">Processing digital artifacts...</p>
            </div>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full w-full origin-left animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-brand-purple to-transparent" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-pulse rounded-full bg-purple-500/20 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                <Upload className="h-8 w-8 text-white transition-colors group-hover:text-purple-300" />
              </div>

              <div className="absolute -right-4 -top-4 rounded-full border border-white/10 bg-black/60 px-2 py-1 backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-yellow-400" />
              </div>
            </div>

            <h3 className="mb-2 text-2xl font-bold bg-gradient-to-br from-foreground via-foreground to-brand-purple bg-clip-text text-transparent">
              Drop Visuals Here
            </h3>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-foreground/50">
              Drag & drop your image or <span className="cursor-pointer text-brand-purple underline decoration-brand-purple/30 underline-offset-4 hover:text-brand-purple/70">browse</span>
              <br />to initialize analysis.
            </p>

            <div className="flex items-center gap-3 rounded-full border border-border bg-card/40 px-4 py-1.5 text-xs font-medium text-foreground/50 backdrop-blur-sm">
              <Shield className="h-3 w-3 text-brand-emerald-500" />
              <div className="h-3 w-[1px] bg-border" />
              <span className="tracking-widest uppercase opacity-60">Secure Enclave</span>
            </div>
          </div>
        )}
      </div>

      <div ref={particlesRef} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity">
        <div className="absolute left-1/4 top-1/4 h-1 w-1 rounded-full bg-purple-400 shadow-[0_0_10px_currentColor]" />
        <div className="absolute right-1/4 bottom-1/4 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_currentColor]" />
        <div className="absolute right-1/3 top-1/3 h-1 w-1 rounded-full bg-white shadow-[0_0_10px_currentColor]" />
      </div>
    </label>
  );
}
