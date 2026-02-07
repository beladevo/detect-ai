import Link from 'next/link'
import { TIER_RATE_LIMITS } from '@/src/lib/tierConfig'

const tierLabels: Record<string, string> = {
  FREE: 'Free',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise',
}

const responseExample = `{
  "score": 87.3,
  "verdict": "AI generated",
  "presentation": "AI generation detected with high confidence",
  "confidence": 0.97,
  "uncertainty": 0.02,
  "explanations": [
    "Metadata mentions Adobe Firefly",
    "Frequency grid detected near reflections"
  ],
  "hashes": {
    "sha256": "171f290b04b6ca5705e6f6b2c4a0c796edc4a1d7efb2a7a7ae357c4b5d314e74"
  },
  "modules": {
    "visual": {
      "score": 0.92,
      "flags": ["skin_smoothing", "melting_edges"]
    },
    "metadata": {
      "score": 0.78,
      "flags": ["firefly_signature"]
    },
    "physics": {
      "score": 0.65,
      "flags": []
    },
    "frequency": {
      "score": 0.88,
      "flags": ["grid_artifact"]
    },
    "ml": {
      "score": 0.93,
      "flags": []
    },
    "provenance": {
      "score": 0.4,
      "flags": []
    },
    "fusion": {
      "score": 0.87,
      "flags": []
    }
  }
}`

export default function ApiDocsPage() {
  const rateLimitRows = Object.entries(TIER_RATE_LIMITS).map(([tier, limits]) => ({
    tier,
    label: tierLabels[tier] ?? tier,
    daily: limits.daily,
    monthly: limits.monthly,
    perMinute: limits.perMinute,
  }))

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-12">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.4em] text-purple-300">API</p>
          <h1 className="mt-2 text-4xl font-semibold">Imagion Detection API</h1>
          <p className="mt-3 text-lg text-gray-300">
            Send an image, get a verdict. The REST endpoint evaluates visual artifacts,
            metadata, frequency, physics, optional ML models, and fuses every signal into a single response.
            Premium and Enterprise plans include API access, rate limits, and usage telemetry.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-purple-500/60 px-4 py-2 text-sm font-semibold text-purple-200 transition hover:border-purple-400 hover:text-white"
            >
              Manage keys
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
            >
              Upgrade plan
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Authentication</h2>
            <p className="mt-2 text-sm text-gray-300">
              Every request needs the `x-api-key` header. Generate or rotate a key from your dashboard and copy it before sending any detection requests.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm">
            <p className="font-semibold text-gray-200">Example</p>
            <pre className="mt-2 overflow-x-auto text-xs text-gray-300">
              <code>
                curl -X POST https://your-site.com/api/detect{'\n'}
                -H 'x-api-key: imag_your_key_here'{'\n'}
                -F 'file=@/path/to/image.jpg'{'\n'}
                -F 'model=flux-v1'
              </code>
            </pre>
          </div>
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Multipart fields</p>
              <ul className="mt-2 space-y-1">
                <li><span className="font-semibold text-white">file</span> – Required image blob (JPEG, PNG, WebP, HEIC/HEIF).</li>
                <li><span className="font-semibold text-white">model</span> – Optional slug to evaluate a specific model (sanitized on the backend).</li>
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Headers (optional)</p>
              <ul className="mt-2 space-y-1">
                <li><span className="font-semibold text-white">x-detection-source</span> – Tag requests as `extension`, `extension-local`, or `website` for downstream analytics.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Rate limits</h2>
            <p className="mt-2 text-sm text-gray-400">
              The API enforces burst and daily quotas per tier. Every response adds `X-RateLimit-*` headers plus a `Retry-After` when throttled.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/5">
            <table className="w-full text-sm text-gray-200">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Tier</th>
                  <th className="px-4 py-3 text-right">Per minute</th>
                  <th className="px-4 py-3 text-right">Daily</th>
                  <th className="px-4 py-3 text-right">Monthly</th>
                </tr>
              </thead>
              <tbody>
                {rateLimitRows.map((row) => (
                  <tr key={row.tier} className="border-t border-white/5">
                    <td className="px-4 py-4 text-white">{row.label}</td>
                    <td className="px-4 py-4 text-right">{row.perMinute.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">{row.daily.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right">{row.monthly.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Response shape</h2>
            <p className="mt-2 text-sm text-gray-300">
              Successful replies include a score, the fused verdict, presentation copy, uncertainty, per-module insights, and cached hashes for deduplication.
            </p>
          </div>
          <pre className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-gray-200">
            <code>{responseExample}</code>
          </pre>
          <div className="grid gap-4 text-sm text-gray-300 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Key fields</p>
              <ul className="mt-2 space-y-1">
                <li><span className="font-semibold text-white">score</span> – 0‑100 probability that the image is AI-generated.</li>
                <li><span className="font-semibold text-white">presentation</span> – Human-friendly label for UI.</li>
                <li><span className="font-semibold text-white">modules</span> – Deep insights per forensic module.</li>
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Usage headers</p>
              <ul className="mt-2 space-y-1">
                <li><span className="font-semibold text-white">X-RateLimit-Limit</span> – Maximum requests within the current burst window.</li>
                <li><span className="font-semibold text-white">X-RateLimit-Remaining</span> – Remaining credits in this window.</li>
                <li><span className="font-semibold text-white">X-RateLimit-Reset</span> / <span className="font-semibold text-white">Retry-After</span> – When you can retry after a throttle.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl space-y-4">
          <h2 className="text-2xl font-semibold">Errors & protective guards</h2>
          <ul className="space-y-3 text-sm text-gray-300">
            <li>
              <span className="font-semibold text-white">401 Unauthorized</span> – Missing, disabled, or revoked API key. Rotate the key from your dashboard.
            </li>
            <li>
              <span className="font-semibold text-white">429 Rate limit</span> – Burst or daily quotas exceeded. Respect the `Retry-After` header before retrying.
            </li>
            <li>
              <span className="font-semibold text-white">413 Payload too large</span> – Files must be ≤ 10 MB.
            </li>
            <li>
              <span className="font-semibold text-white">415 Unsupported media</span> – Only JPEG/PNG/WebP/HEIC/HEIF are allowed.
            </li>
          </ul>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-200">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Best practices</p>
            <p className="mt-2">
              Cache hashes on your side to avoid duplicated work, honor rate-limit headers, and tag every request with `x-detection-source` so we can attribute requests in the analytics dashboard.
              Use <Link href="/api/usage/status" className="text-purple-200 underline">GET /api/usage/status</Link> to show usage counters to your team.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
