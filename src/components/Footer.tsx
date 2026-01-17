"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Bot, Mail, Shield } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Detection", href: "#upload" },
      { label: "Features", href: "#features" },
      { label: "API (Coming Soon)", href: "#waitlist" },
    ],
    resources: [
      { label: "Privacy", href: "#privacy" },
      { label: "Documentation", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Mail, href: "#", label: "Contact" },
  ];

  return (
    <footer className="relative border-t border-white/[0.06] bg-gradient-to-b from-transparent to-black/20">
      {/* Top glow line */}
      <div
        className="absolute left-[20%] right-[20%] top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-md" />
                <Image
                  src="/logo.png"
                  alt="DetectAI Logo"
                  width={32}
                  height={32}
                  className="relative rounded-lg"
                />
              </div>
              <span className="font-display text-lg font-semibold flex items-center">
                <span className="text-white">Imag</span>
                <span className="text-purple-400">ion</span>
                <Bot className="ml-2 h-5 w-5 text-purple-400" />
              </span>
            </div>

            <p className="mt-4 max-w-sm text-sm text-gray-400">
              Imagion — expose synthetic content with forensic-grade AI analysis.
              Privacy-first, on-device processing.
            </p>

            {/* Trust badge */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">
                100% Privacy-First
              </span>
            </div>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 transition-all duration-300 hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-400"
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-gray-500">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-gray-500">
              Resources
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row"
        >
          <p className="text-xs text-gray-500">
            &copy; {currentYear} Imagion. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Local scans only. You control what gets stored or cleared.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
