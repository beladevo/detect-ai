"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";
import GlassCard from "./ui/GlassCard";

const faqs = [
  {
    question: "How does the AI detection work?",
    answer:
      "Our detection engine uses advanced neural networks trained on millions of images to identify subtle patterns and artifacts that distinguish AI-generated content from authentic photographs. The model analyzes pixel-level signatures, compression artifacts, and generation patterns unique to different AI systems.",
  },
  {
    question: "Is my data kept private?",
    answer:
      "Yes, absolutely. All image analysis happens locally on your device using WebAssembly technology. Your images are never uploaded to our servers. We believe in privacy-first design, so you maintain complete control over your data at all times.",
  },
  {
    question: "How accurate is the detection?",
    answer:
      "Our model achieves high accuracy rates on most AI-generated images, especially those from popular generators like Midjourney, DALL-E, and Stable Diffusion. However, no detection system is perfect—heavily edited images, screenshots, or low-quality content may produce less reliable results.",
  },
  {
    question: "What image formats are supported?",
    answer:
      "We support all common image formats including PNG, JPG, JPEG, and WebP. For best results, use the original image file rather than screenshots or heavily compressed versions. Maximum file size is 10MB.",
  },
  {
    question: "Is the service free to use?",
    answer:
      "Yes! The local detection feature is completely free during our beta period. We're developing a server-side API for teams and businesses that need higher throughput and batch processing. Join the waitlist to get early access and special pricing.",
  },
  {
    question: "What's coming with the Server API?",
    answer:
      "The upcoming Server API will offer batch processing, higher accuracy models, detailed forensic reports, webhook integrations, and enterprise-grade SLAs. Perfect for content platforms, news organizations, and businesses that need to verify image authenticity at scale.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6"
    >
      <GlassCard hover={false} glow="cyan" className="p-8 sm:p-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 px-4 py-2 backdrop-blur-sm">
            <HelpCircle className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-gray-300">
              FAQ
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="text-white">Frequently Asked </span>
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            Everything you need to know about our AI detection technology and how it works.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <motion.div
                className={`
                  group overflow-hidden rounded-2xl border transition-all duration-300
                  ${openIndex === index
                    ? "border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-white/[0.04] to-transparent shadow-[0_0_40px_rgba(139,92,246,0.1)]"
                    : "border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent hover:border-white/20"
                  }
                `}
              >
                {/* Question */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                        flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                        border transition-all duration-300
                        ${openIndex === index
                          ? "border-purple-500/30 bg-purple-500/20 text-purple-400"
                          : "border-white/10 bg-white/5 text-gray-400 group-hover:border-cyan-500/30 group-hover:text-cyan-400"
                        }
                      `}
                    >
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-white">{faq.question}</span>
                  </div>

                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`
                      flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                      transition-colors duration-300
                      ${openIndex === index
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-white/5 text-gray-400"
                      }
                    `}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/[0.06] px-6 pb-6 pt-4">
                        <div className="ml-14">
                          <p className="text-sm leading-relaxed text-gray-400">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
              <HelpCircle className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Still have questions?</p>
              <p className="text-xs text-gray-400">
                Contact us at{" "}
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@imagion.ai"}`}
                  className="text-cyan-400 hover:underline"
                >
                  {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@imagion.ai"}
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </GlassCard>
    </section>
  );
}
