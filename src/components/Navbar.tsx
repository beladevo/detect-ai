"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Menu, X } from "lucide-react";
import GlowButton from "./ui/GlowButton";

type NavbarProps = {
  onActionClick: () => void;
};

export default function Navbar({ onActionClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#upload", label: "Detection" },
    { href: "#features", label: "Features" },
    { href: "#waitlist", label: "Coming Soon" },
    { href: "#privacy", label: "Privacy" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div
            className={`
              relative overflow-hidden rounded-2xl
              border transition-all duration-500
              ${scrolled
                ? "border-white/10 bg-black/60 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                : "border-white/[0.06] bg-white/[0.02]"
              }
              backdrop-blur-xl
            `}
          >
            {/* Glass shine effect */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)",
              }}
            />

            {/* Top edge glow */}
            <div
              className="pointer-events-none absolute left-[20%] right-[20%] top-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)",
              }}
            />

            <div className="relative flex items-center justify-between px-6 py-3">
              {/* Logo */}
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-md" />
                  <Image
                    src="/logo.png"
                    alt="DetectAI Logo"
                    width={36}
                    height={36}
                    className="relative rounded-xl"
                  />
                </div>
                <span className="font-display text-lg font-semibold tracking-tight flex items-center">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Imag
                  </span>
                  <span className="text-purple-300">ion</span>
                  <Bot className="ml-2 h-5 w-5 text-purple-300" />
                </span>
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden items-center gap-1 md:flex">
                {navLinks.map((link) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    className="group relative px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white"
                    whileHover={{ y: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <span className="relative z-10">{link.label}</span>
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-white/[0.05]"
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.div
                      className="absolute bottom-1 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                      whileHover={{ width: "60%" }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.a>
                ))}
              </div>

              {/* CTA Button */}
              <div className="flex items-center gap-3">
                <GlowButton
                  onClick={onActionClick}
                  size="sm"
                  className="hidden md:flex"
                >
                  Start Scan
                </GlowButton>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white md:hidden"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-40 px-4 md:hidden"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="mt-2 border-t border-white/10 pt-4">
                  <GlowButton onClick={onActionClick} className="w-full">
                    Start Scan
                  </GlowButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
