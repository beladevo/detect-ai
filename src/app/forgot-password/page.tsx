"use client"

import { useState } from 'react'
import Link from 'next/link'
import GlowButton from '@/src/components/ui/GlowButton'
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [resetLink, setResetLink] = useState<string | null>(null)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfoMessage(null)
    setResetLink(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Unable to send reset instructions')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      setInfoMessage(data.message || 'Check your inbox for password reset instructions.')
      setResetLink(data.resetUrl || null)
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <Link
        href="/"
        className="absolute left-8 top-8 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="relative w-full max-w-md">
        <form
          onSubmit={handleReset}
          className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Mail className="h-8 w-8 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Forgot your password?</h1>
            <p className="mt-2 text-sm text-gray-400">
              Enter your email and we’ll send a link to reset it.
            </p>
          </div>

          {success && (
            <div className="flex flex-col gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
                <p className="font-medium">{infoMessage}</p>
              </div>
              <p className="text-xs text-green-300/80">
                Follow the emailed link within one hour before it expires.
              </p>
              {resetLink && (
                <a
                  href={resetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-white underline"
                >
                  Open reset link
                </a>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-gray-500 transition-colors focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
          </div>

          <GlowButton
            type="submit"
            disabled={loading || success}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Sending link...
              </span>
            ) : success ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Check your inbox
              </span>
            ) : (
              'Send reset link'
            )}
          </GlowButton>

          <p className="text-center text-xs text-gray-400">
            If the email exists we’ll send instructions; otherwise you’ll still see this message.
          </p>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-900 px-4 text-gray-400">Need to sign in?</span>
            </div>
          </div>

          <Link
            href="/login"
            className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 text-center text-sm font-medium text-purple-400 transition-colors hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300"
          >
            Return to login
          </Link>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Premium features are currently enabled for all users during beta
        </p>
      </div>
    </div>
  )
}
