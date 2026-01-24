# AGENTS Instructions for LLMs

This file serves as the first stop whenever an LLM agent touches this repository. Treat it as a reminder of the repo’s intent, the canonical docs, and how to stay aligned with the existing workflows.

## Mission
- You are supporting the **Imagion AI Detector** platform, which combines a Next.js control plane, a heuristic/ML detection pipeline, and a Chrome extension that surfaces badges on web images.
- Your decisions must keep the detection API, the UI, and the extension in sync. Check all affected layers before making changes (for example, adjusting a verdict presentation might need updates to the API response, the extension badge, and the dashboard).

## Required reading order
1. `internal-docs/SYSTEM-OVERVIEW.md` – this page summarizes the code layout, data ﬂows, and operational scripts.
2. `src/lib/pipeline/TECHNICAL_DOCS.md` – it explains every forensic module, what it inspects, and its current limitations.
3. Any relevant UI docs (`internal-docs/UI-DESIGN-GUIDE.md`) or migration/model guides under `docs/` when touching those areas.

## Typical workflows
- Start with `npm install` at the repo root and `npm run dev` for the Next app. Use `extension/` + `npm run dev` there when working on badge/UI logic.
- Prisma migrations are run through `npm run db:migrate` (use `db:migrate:prod` for production-like pushes). Use `npm run docker:up` if you need Mongo/Redis locally.
- When verifying detectors, `scripts/verify-api.cjs` and `scripts/compare-detectors.cjs` are the canonical sanity checks. Model conversion, blob uploads, and detector comparisons all live under `scripts/`.
- Extension builds call `npm run build` inside `extension/`. Build artifacts land in `extension/dist` and must be uploaded via your packaging process (manual or automated).

## Communication & validation cues
- Always mention what you tested (unit tests, lint, manual Next run, extension build). If you cannot run a command, explain why.
- Highlight configuration needs (e.g., API keys in `chrome.storage`, `NEXT_PUBLIC_*` flags, Redis URLs) whenever they affect the change.
- If a change spans backend + extension, describe both sides and reference the relevant docs (this overview, pipeline docs, extension README).

## Keeping the docs up to date
- Any time you expose, rename, or remove a subsystem, update `internal-docs/SYSTEM-OVERVIEW.md` and this file as needed so future agents inherit the correct mental model.
