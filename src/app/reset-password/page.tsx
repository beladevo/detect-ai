"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import GlowButton from '@/src/components/ui/GlowButton'
import { ArrowLeft, Lock, CheckCircle2, AlertCircle } from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const tokenFromQuery = searchParams.get('token') ?? ''
  const [token, setToken] = useState(tokenFromQuery)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  useEffect(() => {
    setToken(tokenFromQuery)
  }, [tokenFromQuery])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)

    if (!token) {
      setError('Reset token is required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Unable to reset password')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      setInfoMessage(data.message || 'Password reset successfully. You can now sign in.')
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleReset}
      className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
    >
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <Lock className="h-8 w-8 text-purple-400" />
        </div>
        <h1 className="text-3xl font-bold text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-400">
          Enter the token from your email along with a new password.
        </p>
      </div>

      {success && (
        <div className="flex flex-col gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
            <p className="font-medium">{infoMessage}</p>
          </div>
          <p className="text-xs text-green-300/80">
            You can now sign in with your updated credentials.
          </p>
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
            Reset Token
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Paste token from email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-3 px-4 text-white placeholder:text-gray-500 transition-colors focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
            />
          </div>
          {!token && (
            <p className="mt-1 text-xs text-gray-400">
              Token can also be supplied from the email link query parameter.
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder="Enter a new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-gray-500 transition-colors focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
              minLength={8}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder="Re-type your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-gray-500 transition-colors focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
              minLength={8}
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
            Resetting password...
          </span>
        ) : success ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Password updated
          </span>
        ) : (
          'Reset password'
        )}
      </GlowButton>

      <p className="text-center text-xs text-gray-400">
        We enforce strong passwords with uppercase, lowercase, and numbers.
      </p>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-900 px-4 text-gray-400">Need help?</span>
        </div>
      </div>

      <div className="grid gap-3 text-sm">
        <Link
          href="/login"
          className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 text-center font-medium text-purple-400 transition-colors hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300"
        >
          Back to login
        </Link>
        <Link
          href="/forgot-password"
          className="block w-full rounded-lg border border-white/10 bg-transparent py-3 text-center font-medium text-gray-300 transition-colors hover:border-purple-500/30 hover:text-white"
        >
          Request a new token
        </Link>
      </div>
    </form>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl animate-pulse">
      <div className="text-center">
        <div className="mb-4 mx-auto h-16 w-16 rounded-2xl bg-white/10" />
        <div className="h-8 w-48 mx-auto bg-white/10 rounded" />
        <div className="mt-2 h-4 w-64 mx-auto bg-white/10 rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-12 bg-white/10 rounded-lg" />
        <div className="h-12 bg-white/10 rounded-lg" />
        <div className="h-12 bg-white/10 rounded-lg" />
      </div>
      <div className="h-12 bg-white/10 rounded-lg" />
    </div>
  )
}

export default function ResetPasswordPage() {
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
        <Suspense fallback={<FormSkeleton />}>
          <ResetPasswordForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-gray-500">
          Premium features are currently enabled for all users during beta
        </p>
      </div>
    </div>
  )
}
