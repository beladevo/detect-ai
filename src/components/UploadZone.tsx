"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Shield } from "lucide-react";

type UploadZoneProps = {
  isUploading: boolean;
  onFileSelected: (file: File) => void;
};

export default function UploadZone({ isUploading, onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const particles = Array.from({ length: 6 }, (_, index) => ({
    id: index,
    x: `${20 + ((index * 17) % 60)}%`,
    duration: 3 + (index % 3) * 0.6,
    delay: index * 0.5,
  }));

  const handleFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <motion.label
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        group relative flex h-72 w-full cursor-pointer flex-col items-center justify-center
        overflow-hidden rounded-3xl
        border-2 border-dashed
        transition-all duration-500
        ${isDragging
          ? "border-purple-400/60 bg-purple-500/10 shadow-[0_0_60px_rgba(139,92,246,0.2)]"
          : "border-white/20 bg-gradient-to-br from-white/[0.05] to-purple-500/[0.05] hover:border-purple-500/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]"
        }
        backdrop-blur-xl
      `}
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
      whileHover={{ scale: 1.01, y: -4 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Glass shine effect */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
        }}
      />

      {/* Animated border gradient */}
      <div
        className={`
          pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500
          ${isDragging ? "opacity-100" : "group-hover:opacity-60"}
        `}
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2), rgba(6,182,212,0.2))",
          filter: "blur(20px)",
        }}
      />

      {/* Floating particles effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute h-1 w-1 rounded-full bg-purple-400/40"
            initial={{
              x: particle.x,
              y: "100%",
              opacity: 0,
            }}
            animate={{
              y: "-10%",
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files)}
      />

      <AnimatePresence mode="wait">
        {isUploading ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Animated spinner */}
            <div className="relative">
              <motion.div
                className="h-16 w-16 rounded-full border-2 border-purple-500/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-0 h-16 w-16 rounded-full border-2 border-transparent border-t-purple-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-purple-400" />
            </div>

            <motion.p
              className="mt-6 text-sm font-medium text-purple-300"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Analyzing digital artifacts...
            </motion.p>

            {/* Progress bars skeleton */}
            <div className="mt-6 w-48 space-y-2">
              <motion.div
                className="h-1.5 rounded-full bg-gradient-to-r from-purple-500/40 to-pink-500/40"
                animate={{ scaleX: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ transformOrigin: "left" }}
              />
              <motion.div
                className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30"
                animate={{ scaleX: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                style={{ transformOrigin: "left" }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Upload icon with glow */}
            <motion.div
              className="relative"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-purple-500/30">
                <Upload className="h-8 w-8 text-purple-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
            </motion.div>

            <motion.p
              className="mt-6 text-xl font-semibold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Drag an image here
            </motion.p>

            <motion.p
              className="mt-2 text-sm text-gray-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              PNG, JPG, WEBP up to 10MB
            </motion.p>

            <motion.div
              className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Shield className="h-3 w-3 text-emerald-400" />
              <span className="text-xs uppercase tracking-[0.25em] text-gray-500">
                Secure & Private
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.label>
  );
}
