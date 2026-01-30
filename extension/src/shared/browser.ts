// Cross-browser compatibility wrapper
// Provides a unified 'browser' API that works in Chrome, Firefox, and Edge

type BrowserAPI = typeof chrome;

let browserAPI: BrowserAPI;

// Detect environment and assign appropriate API
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
  // Chrome/Edge environment
  browserAPI = chrome;
} else if (typeof browser !== "undefined" && browser.runtime && browser.runtime.id) {
  // Firefox environment
  browserAPI = browser as unknown as typeof chrome;
} else {
  // Fallback to chrome (build-time safety)
  browserAPI = chrome;
}

export { browserAPI as browser };

// Type guard to check if we're in a Firefox environment
export function isFirefox(): boolean {
  return typeof navigator !== "undefined" && /Firefox/.test(navigator.userAgent);
}

// Type guard to check if we're in a Chrome environment
export function isChrome(): boolean {
  return typeof navigator !== "undefined" && /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
}

// Type guard to check if we're in an Edge environment
export function isEdge(): boolean {
  return typeof navigator !== "undefined" && /Edg/.test(navigator.userAgent);
}
