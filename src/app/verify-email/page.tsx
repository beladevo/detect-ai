"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import GlowButton from "@/src/components/ui/GlowButton"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

type VerificationStatus = "idle" | "loading" | "success" | "error"

export default function VerifyEmailPage() {
  const router = useRouter()
  const [status, setStatus] = useState<VerificationStatus>("idle")
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")

    if (!token) {
      setStatus("error")
      setMessage("Verification link is missing or invalid.")
      return
    }

    setStatus("loading")

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.error || "Verification failed")
        }
        setStatus("success")
        setMessage(payload.message || "Email verified successfully.")
      })
      .catch((error) => {
        console.error("Email verification error:", error)
        setStatus("error")
        setMessage(error.message || "Unable to verify your email right now.")
      })
  }, [])

  const renderIcon = () => {
    if (status === "loading") {
      return <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
    }

    if (status === "success") {
      return <CheckCircle2 className="h-6 w-6 text-green-400" />
    }

    return <AlertCircle className="h-6 w-6 text-yellow-400" />
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 px-4">
      <div className="relative w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Email Verification</p>
          <h1 className="mt-2 text-3xl font-bold text-white">One last step</h1>
          <p className="mt-2 text-sm text-gray-400">
            {status === "loading" ? "Checking your verification link..." : "Click the button below once your email is verified."}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          {renderIcon()}
          <p className="text-sm text-gray-200">{message || "Finding your verification status..."}</p>
        </div>

        {status === "success" && (
          <GlowButton className="w-full" onClick={() => router.push("/login")}>
            Return to login
          </GlowButton>
        )}

        {status === "error" && (
          <p className="text-center text-xs text-gray-400">
            If you still didn’t receive an email, please check your spam folder or try registering again.
          </p>
        )}
      </div>
    </div>
  )
}
