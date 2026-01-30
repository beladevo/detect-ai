"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react"
import GlowButton from "@/src/components/ui/GlowButton"

type SurveyState = "survey" | "submitting" | "thanks" | "error"
type SurveyResponse = "YEAH_SURE" | "NOT_REALLY" | "MAYBE"

const PREMIUM_FEATURES = [
  "1,000 detections per day",
  "Up to 10,000 detections per month",
  "Server-side detection with larger models",
  "Multiple model voting for higher confidence",
  "Priority multi-model ensemble",
  "Advanced analytics + audit logs",
  "API access and batch export",
]

const RESPONSE_OPTIONS: { value: SurveyResponse; label: string }[] = [
  { value: "YEAH_SURE", label: "Yeah sure!" },
  { value: "NOT_REALLY", label: "Not really" },
  { value: "MAYBE", label: "Maybe" },
]

export default function PricingSurveyOverlay() {
  const [state, setState] = useState<SurveyState>("survey")
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null)

  const handleSubmit = async (response: SurveyResponse) => {
    setSelectedResponse(response)
    setState("submitting")

    try {
      const res = await fetch("/api/pricing-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      })

      if (res.ok) {
        setState("thanks")
      } else {
        setState("error")
      }
    } catch {
      setState("error")
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background decorative elements matching pricing page */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Back to Home link - always visible */}
      <Link
        href="/"
        className="absolute left-8 top-8 z-10 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <AnimatePresence mode="wait">
        {(state === "survey" || state === "submitting") && (
          <motion.div
            key="survey"
            className="relative mx-4 w-full max-w-lg rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-500/20 via-white/5 to-cyan-500/10 p-8 shadow-[0_20px_60px_rgba(124,58,237,0.25)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-purple-300/70">
                Coming Soon
              </p>
              <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">
                Are you interested in the premium plan?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-gray-400">
                We are working on premium features. Your feedback helps us prioritize.
              </p>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-gray-200">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              {RESPONSE_OPTIONS.map((option) => (
                <GlowButton
                  key={option.value}
                  onClick={() => handleSubmit(option.value)}
                  disabled={state === "submitting"}
                  variant={option.value === "YEAH_SURE" ? "primary" : "secondary"}
                  className="w-full"
                >
                  {state === "submitting" && selectedResponse === option.value
                    ? "Submitting..."
                    : option.label}
                </GlowButton>
              ))}
            </div>
          </motion.div>
        )}

        {state === "thanks" && (
          <motion.div
            key="thanks"
            className="relative mx-4 w-full max-w-lg rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-500/20 via-white/5 to-cyan-500/10 p-8 text-center shadow-[0_20px_60px_rgba(124,58,237,0.25)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="mt-4 text-2xl font-bold text-white">
              Thank you for your feedback!
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              We will keep you updated as premium features roll out.
            </p>
            <div className="mt-6">
              <Link href="/">
                <GlowButton className="w-full">Back to Home</GlowButton>
              </Link>
            </div>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            key="error"
            className="relative mx-4 w-full max-w-lg rounded-3xl border border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-white/5 to-transparent p-8 text-center backdrop-blur-xl"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-400">Please try again later.</p>
            <div className="mt-6">
              <GlowButton onClick={() => setState("survey")} className="w-full">
                Try Again
              </GlowButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
