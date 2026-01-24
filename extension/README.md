# Imagion Detection Badge Extension Plan

This folder contains the Chromium-compatible browser extension that will run alongside Imagion's web app. The detection logic is authored in TypeScript, compiled to `dist/`, and remains a lightweight proof-of-concept that checks images on visited pages and annotates them with Imagion's verdict using the same `/api/detect` endpoint already served by the main app.

## Architecture
1. **Content script (`content.js`)** scans for `<img>` elements, attaches badge containers, and keeps a mutation observer alive so dynamically added images get inspected.
2. **Background service worker (`background.js`)** orchestrates fetching the actual image bytes, runs detection against the backend, caches results (by image URL hash), and enforces a simple concurrency limit plus rate awareness.
3. **Options UI (`options.html` + `options.js`)** lets the user paste an Imagion API key (retrieved from the logged-in dashboard) and configure badge visibility/debounce settings.
4. **Messaging channel**: content scripts request detections via `chrome.runtime.sendMessage`, background resolves the request and replies with the badge metadata once analysis is complete.

## Authentication & API Key Storage
- The extension stores the Imagion API key in `chrome.storage.local` under `imagionApiKey`. The background worker appends it to the configured detection endpoint as `x-api-key`, matching the backend's existing expectations.
- The options page also lets the user override the detection endpoint (`imagionDetectionEndpoint`) in case they run a staging server or want to point to `localhost`.
- A badge toggle (`imagionBadgeEnabled`) is exposed in the options page so the user can pause annotations while browsing without uninstalling the extension.
- Until the user provides a key, the extension runs in "preview only" mode where it avoids calling the detection pipeline and instead shows a hint badge that prompts the user to log in.

## Detection Workflow
1. Background worker keeps a queue of pending images, deduplicates by URL, and handles up to 3 simultaneous fetches.
2. Each image fetch runs `fetch(url)` under the extension context (requires `<all_urls>` host permission), converts the blob to `FormData`, and submits `POST /api/detect` using the stored API key.
3. Successful responses are cached for 5 minutes (configurable in future) to avoid repeated hits on pages that reuse the same image.
4. Every response carries `verdict`, `score`, and `confidence`; the content script renders a badge with the Imagion mark plus "AI", "Real", or "Unknown".

## Badge & UX Notes
- Badges are absolutely positioned in the top-right corner of each image container, with a subtle `box-shadow` and translucent background so they do not disrupt the layout.
- Clicking or hovering a badge reveals a tooltip with the score/confidence to keep the UI unobtrusive.
- Options let the user disable badges or pause detection on a per-domain basis to respect performance concerns.

## Next Steps
- Run `npm install` inside `extension/` and then `npm run build` to compile TypeScript sources into `dist/`.
- Package the `extension/` directory (including `manifest.json` and `dist/`) for Chrome/Firefox deployment or load it via developer mode to test in-browser.
