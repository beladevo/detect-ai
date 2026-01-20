"use client"

import { useState } from 'react'
import { createClient } from '@/src/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import GlowButton from '@/src/components/ui/GlowButton'
import { LogIn, Mail, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Redirect after a short delay to show success message
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 px-4">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Back to home button */}
      <Link
        href="/"
        className="absolute left-8 top-8 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="relative w-full max-w-md">
        <form
          onSubmit={handleLogin}
          className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <LogIn className="h-8 w-8 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
            <p className="mt-2 text-sm text-gray-400">Sign in to your account</p>
          </div>

          {/* Success message */}
          {success && (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
              <div>
                <p className="font-medium">Successfully signed in!</p>
                <p className="text-xs text-green-300/80">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <p>{error}</p>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            {/* Email field */}
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

            {/* Password field */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-purple-400 transition-colors hover:text-purple-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-gray-500 transition-colors focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
            <label htmlFor="remember-me" className="ml-2 text-sm text-gray-400">
              Remember me for 30 days
            </label>
          </div>

          {/* Submit button */}
          <GlowButton
            type="submit"
            disabled={loading || success}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Signing in...
              </span>
            ) : success ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Signed In!
              </span>
            ) : (
              'Sign In'
            )}
          </GlowButton>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-900 px-4 text-gray-400">New to Imagion?</span>
            </div>
          </div>

          {/* Register link */}
          <Link
            href="/register"
            className="block w-full rounded-lg border border-white/10 bg-white/5 py-3 text-center text-sm font-medium text-purple-400 transition-colors hover:border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300"
          >
            Create an account
          </Link>
        </form>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Premium features are currently enabled for all users during beta
        </p>
      </div>
    </div>
  )
}

