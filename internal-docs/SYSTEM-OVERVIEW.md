# System Overview for LLM Agents

This repository bundles a Next.js-powered control plane, a high-fidelity image-detection pipeline, and a Chrome extension that surfaces those verdicts on arbitrary web pages. The purpose of this page is to give LLM-based contributors a compact but complete picture of how the pieces fit together so you can reason about changes across the UI, API, inference layers, and auxiliary tooling.

## High-level architecture
- **Next.js app (root `src/app`)** – renders marketing pages, account flows, the dashboard, admin tools, and exposes the `app/api` routes that power the detection API, billing integrations, and user management.
- **Inference pipeline (`src/lib/pipeline`)** – a modular, heuristic + ML engine that preprocesses uploads, runs visual/metadata/physics/frequency checks, optionally consults ONNX models, and fuses every signal into a single verdict.
- **Chrome extension (`extension/`)** – injects badges (`content.ts`), provides a login popup/options UI, and proxies image URLs through a background service worker that respects rate limits, telemetry, and caching while calling `POST /api/detect` on the Next app with the user’s API key.
- **Operational layers** – Prisma + Postgres/MongoDB for persistence, Redis for rate limiting, Stripe/PayPal for billing, Vercel Blob (or equivalent) for assets, and supporting scripts (`scripts/`) that introspect detectors, convert/export models, and validate responses.

## Next.js control plane
- The project uses **Next.js 16 App Router** + TypeScript. The theme/styles live in `src/app/globals.css` and `src/app/layout.tsx`, while reusable pieces sit under `src/components` and shared state/hooks under `src/context`.
- Entry points in `src/app` are organized by route (e.g., `login`, `register`, `pricing`, `dashboard`, `admin`, `api/*`). Each route imports helpers from `src/lib`.
- The `app/api` folder contains the key server endpoints:
  - `/api/auth/*` – handles session tokens, password checks, API key creation, and extension-specific login (`auth/extension/route.ts`).
  - `/api/detect` – the detection API described below.
  - `/api/checkout`, `/api/billing`, `/api/paypal` – wrap Stripe/PayPal flows.
  - `/api/users`, `/api/usage`, `/api/logs` – serve the dashboard/admin with metrics.
- Utility helpers live under `src/lib` (e.g., `auth/`, `rateLimit.ts`, `loggerServer.ts`, `prisma.ts`, `env.ts`, `scoreUtils.ts`, `models.ts`, `verdictUi.ts`, `billing.ts`, `straipe.ts`, `paypal.ts`, `inferenceLogger.ts`).
- Environment flags are centralized in `src/lib/env.ts`; toggles such as `NEXT_PUBLIC_PIPELINE_VISUAL_ENABLED` control which forensic modules run.

## Detection pipeline
- The heart of the service is `analyzeImagePipeline` (see `src/lib/pipeline/analyzeImagePipeline.ts`). Every upload flows through:
  1. **Preprocess** – normalization, perceptual hash generation (`preprocess.ts`).
  2. **Visual artifacts** – skin texture, symmetry, melting artifact detection (`visualArtifacts.ts`).
  3. **Metadata forensics** – EXIF/IPTC parsing and generator signature spotting (`metadataForensics.ts`).
  4. **Physics consistency** – shadow/perspective checks (`physicsConsistency.ts`).
  5. **Frequency forensics** – FFT checks for GAN grids (`frequencyForensics.ts`).
  6. **Provenance** – C2PA/CAI signature validation (`provenance.ts`).
  7. **ML Ensemble** – optional ONNX inference (`mlEnsemble.ts`). Model selection logic lives under `src/lib/models.ts`/`modelSelection.ts` and is documented in `docs/MODEL_SELECTION_GUIDE.md`.
  8. **Fusion** – weights every signal and exposes the final probability/confidence (`fusion.ts`).
- Outputs include verdict details (`verdict.ts`), explanations, per-module scores, hashes, and presentation text (`verdictUi.ts`). A technical overview lives in `src/lib/pipeline/TECHNICAL_DOCS.md`.

## Detection API (`POST /api/detect`)
- Authenticated requests (via API key/JWT) hit the endpoint, which uses Prisma to persist usage logs, rate-limit checks (`rateLimit.ts`, both burst and daily), and caches processed hashes in `processedImage`.
- It enforces a 10MB limit, whitelists MIME types, computes SHA-256 hashes, checks the processed cache, dispatches the pipeline, stores the detection and usage records, and returns JSON with `score`, `verdict`, `confidence`, `uncertainty`, `modules`, and `presentation`.
- Failures emit structured errors with `errorType`, status codes, and optional headers (`X-RateLimit-*`, `Retry-After`). Rate limiting and logging are instrumented via `loggerServer.ts`.

## Chrome extension
- Built with TypeScript + Vite. The manifest, icons, popup, options, and background script live under `extension/src`. Build scripts (`extension/scripts/build.ts`) produce `dist/{content.js,popup.js,options.js,background.js}` for packaging.
- **Content script** (`content.ts`) scans the DOM, wraps large images with badges, and asks the background worker for detections while respecting `chrome.storage` toggles (`imagionBadgeEnabled`, `imagionDisabledHosts`). Badges display status and localized labels.
- **Popup** (`popup.ts`) authenticates users through `POST /api/auth/extension`, stores API keys/endpoints in `chrome.storage`, and exposes toggles/counters.
- **Background worker** (`background.ts`) opens image URLs, hashes them, caches responses, queues requests (max 3 concurrent), rate-limits retries/backoff, records telemetry, and forwards results to the popup/content scripts.
- **Options** (`options.ts`) exposes host block lists, endpoint overrides, and API key fields. The extension respects language locales and keeps telemetry in `imagionTelemetry`.
- **Admin controls** (`options.ts`) now show a plan tier selector, a detection-mode toggle (API vs. local LLM), and a local-endpoint override. The background worker reads `imagionDetectionMode`/`imagionLocalEndpoint` from storage to decide whether to call `/api/detect` or a user-specified local inference endpoint while maintaining caches/rate limits.

## Supporting infrastructure
- **Database** – Prisma (connects via `DATABASE_URL` for Postgres, optional `MONGODB_URI` for server logging). Schemas cover `user`, `detection`, `processedImage`, `usageLog`, etc.
- **Caching & rate limiting** – Redis via `REDIS_URL`; used by `rateLimit.ts` and `session.ts`.
- **Storage** – optional blob storage (Vercel Blob) or any CDN behind `NEXT_PUBLIC_BLOB_BASE_URL`.
- **Billing** – Stripe & PayPal helpers under `src/lib/stripe.ts` and `src/lib/paypal.ts`. Pricing/tier logic is in the UI and `src/lib/features`.
- **Scripts** – the `scripts/` folder holds motor tasks (`compare-detectors.cjs`, ONNX conversion/upload, `verify-api.cjs`, etc.). They are used to sanity-check the detector, manage models, and migrate raw assets.
- **Docs** – `docs/MIGRATION_GUIDE.md`, `docs/MODEL_SELECTION_GUIDE.md`, `internal-docs/UI-DESIGN-GUIDE.md`, and this page are canonical references for continuing work.

## Self-hosted deployment architecture
The production environment runs on a home Ubuntu server with KVM-based isolation. The architecture separates concerns across layers:

```
Internet → Cloudflare (DNS + TLS) → cloudflared container ─┐
                                                            │ tunnel network
Tailscale → SSH tunnel → 127.0.0.1:3000 ───────────────────┼──→ app (Next.js :3000)
                                                            │         │
                                                            │    internal network
                                                            │     ┌───┴───┐
                                                            │  postgres  redis
                                                            │
Host OS (Ubuntu, runs Immich) ──── KVM VM (Ubuntu) ─────────┘
```

- **Host isolation**: The app runs inside a KVM/libvirt VM, completely separate from the host OS and its Immich installation.
- **Docker Compose** (`docker-compose.prod.yml`) orchestrates four services: `app`, `postgres`, `redis`, and `cloudflared` (opt-in via the `tunnel` profile). A one-shot `migrate` service (profile `migration`) runs Prisma migrations.
- **Network isolation**: Postgres and Redis sit on an `internal: true` Docker network with no port bindings. The app bridges both the internal and tunnel networks. Cloudflared connects to the tunnel network only.
- **ONNX models**: Volume-mounted from the VM filesystem (`/opt/imagion/models/`) into the container at `/app/public/models/onnx:ro`. Not baked into the Docker image.
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`) builds the image, pushes to `ghcr.io/beladevo/detect-ai`, and deploys via SSH over Tailscale. The deploy script handles ghcr.io login, image pull, migration, restart, and health-check verification.
- **Access modes**: Public access via Cloudflare Tunnel (when a custom domain is configured), private/admin access via Tailscale SSH tunnel to `127.0.0.1:3000`.
- **Config files**: `Dockerfile` (multi-stage: deps → builder → runner), `.dockerignore`, `.env.production.example`, `docker-compose.prod.yml`. See `internal-docs/LOCAL-DEPLOYMENT.md` for the full setup guide.

## Development & validation workflow
- Use `npm install` (or `pnpm`/`yarn` if preferred) at the repository root, then `npm run dev` to serve the Next app on port 3000. Environment variables come from `.env`, `.env.local`, or platform overrides.
- Key repo scripts: `npm run build`, `npm run lint`, `npm run compare:local`, `npm run docker:up`. Run Prisma commands (`db:migrate`, `db:seed`, `db:studio`) when the schema changes.
- Extension development happens under `extension/` with `npm install` + `npm run dev` (watch mode builds content/popup/background). Use `npm run build` to produce distributable assets, and `npm run test`/`typecheck`/`lint` as needed.
- **Local dev infra**: Use `docker-compose.yml` to spin up Postgres and Redis. This is the dev-only compose file (ports exposed, no app service).
- **Production deployment**: Use `docker-compose.prod.yml` on the VM. Push to `main` triggers CI/CD. See `internal-docs/LOCAL-DEPLOYMENT.md`.
- For detection sanity checks, `scripts/verify-api.cjs` and `scripts/compare-detectors.cjs` against known inputs are authoritative, while `scripts/upload-models-to-blob.mjs` syncs ONNX artifacts.

## Guidance for LLM contributors
1. **Start here** – read this overview and `src/lib/pipeline/TECHNICAL_DOCS.md` before editing pipeline code. Understand which module owns a behavior before adjusting fusion scores or heuristics.
2. **Trace the user path** – follow the flow from UI → API → pipeline → persistence/extension to ensure you touch every affected layer (messages, telemetry, rate limits, caching).
3. **Respect config flags** – toggles in `env.ts` and `.env.example` gate expensive modules; mention them when proposing changes that might require flag tweaks.
4. **Call out dependencies** – Prisma migrations, Redis, Stripe/PayPal webhooks, and extension permissions belong to broader systems; signal when they may need updates.
5. **Reference docs** – link to `docs/*` or `internal-docs/*` when describing behavior in PRs or responses, and remind reviewers to confirm environment settings.

Keeping this overview in sync makes it easier for subsequent LLM agents to ship cross-cutting changes with confidence. Update it whenever you expose a new subsystem or workflow.
