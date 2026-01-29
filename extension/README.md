# Imagion Detection Badge Extension

This folder contains the TypeScript-first browser extension that surfaces Imagion's AI detection verdicts directly on any website. The MV3 extension loads the compiled scripts from `dist/`, overlays badges on `<img>` tags, consults Imagion's `/api/detect` endpoint, and lets the user configure API keys, endpoints, badge visibility, and per-host blocking via the options page.

## What's inside

- `manifest.json`: Declares the MV3 metadata, permissions (`storage`, `scripting`, `activeTab`, `<all_urls>`), icons, options page, service worker (`dist/background.js`), and content script (`dist/content.js`).
- `src/background.ts`: Service worker that normalizes URLs, enforces caching, serializes `/api/detect` submissions, adds rate-limit backoff, records telemetry, and dispatches responses to every badge that requested the same image.
- `src/content.ts`: Tracks images, injects status badges, repositions them on scroll/mutation, checks per-host blocking, and localizes dynamic badge labels/tooltips with ARIA-friendly attributes.
- `src/options.ts` + `options.html`: Settings UI where the user can paste their Imagion API key, override the detection endpoint, toggle badges, and maintain a list of hosts that temporarily suppress badges. All values persist in `chrome.storage.local`.
- `package.json` & `tsconfig.json`: TypeScript build tooling (`tsc -p tsconfig.json`) plus Chrome typings (`@types/chrome`). Build outputs land in `dist/`, which is referenced by the manifest.
- `dist/`: Generated artifacts (`background.js`, `content.js`, `options.js`) produced via `npm run build`. This directory is ignored by Git.
- `.gitignore`: Keeps `node_modules/` out of the repo so each developer installs dependencies inside the extension folder.

## Key features

1. **Localized, accessible badges** - Colored badges use ARIA `status` roles, carry localized labels (`AI`, `Real`, `Error`, `Log in`), and show tooltips with score/confidence/presentation/retry hints.
2. **Per-host opt-out** - The options page lets the user add hosts to a block list so the content script skips badge injection on those domains (stored as normalized hostnames).
3. **Rate-limit resilience** - The background worker detects `429` responses, applies a capped backoff window (15-60 seconds), and re-runs the queue when the window expires.
4. **Telemetry logging** - Detection successes/failures, missing-key warnings, and rate-limit events are stored in `chrome.storage.local.imagionTelemetry` (capped to 40 entries) for future debugging or surface-level telemetry.
5. **Simple TypeScript build** - TS sources compile directly to the `dist/` folder with `tsc`, keeping the runtime code small and dependency-free.

## Development

1. `cd extension && npm install` - installs `typescript` and `@types/chrome`.
2. `npm run build` - compiles `src/*.ts` -> `dist/*.js`. The manifest and options page both point at the `dist/` outputs.
3. Load the folder via Chrome/Firefox developer mode (or bundle it) and confirm the options page stores a valid Imagion `x-api-key`. Use the domain block list to pause badges on sensitive hosts.

## Testing & validation

- Manual: Navigate to a site with images, confirm badges appear with the right colors/labels, hover to see tooltips, and note the telemetry entries under `chrome.storage.local.imagionTelemetry`.
- API failures: Without an API key, badges show the "Log in" state. When the backend returns `429`, badges switch to "Rate limited" and display how long until the next attempt.
- Domain blocking: Add a host to the block list via the options page. Reload that host; the extension should remove all badges and leave a tooltip explaining that the host is paused.

Telemetry storage can be probed via the Chrome/Firefox extension inspector (Application -> Storage -> Local Storage) or by reading `chrome.storage.local.imagionTelemetry` programmatically from another page or devtools snippet.
