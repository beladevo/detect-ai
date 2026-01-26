const s = "[Imagion Background]", L = "http://localhost:3000/api/detect";
const P = "imagionTelemetry";
const v = "recentImageHistory";
const E = "imagionRateLimitState";
const F = "#ff4d67", $ = "REQUEST_USAGE_STATUS";
console.info(s, "Service worker started");
const T = /* @__PURE__ */ new Map(), S = /* @__PURE__ */ new Map(), w = [], _ = [];
let I = 0, b = null, h = 0, g = null, u = [];
const K = Z();
V();
async function C() {
  if (b)
    return b;
  const e = await new Promise((t) => {
    chrome.storage.local.get(
      {
        imagionApiKey: "",
        imagionDetectionEndpoint: L
      },
      (o) => {
        t({
          imagionApiKey: typeof o.imagionApiKey == "string" ? o.imagionApiKey.trim() : "",
          imagionDetectionEndpoint: typeof o.imagionDetectionEndpoint == "string" && o.imagionDetectionEndpoint.trim().length > 0 ? o.imagionDetectionEndpoint.trim() : L
        });
      }
    );
  });
  return b = e, console.info(s, "Config loaded:", {
    hasApiKey: !!e.imagionApiKey,
    endpoint: e.imagionDetectionEndpoint
  }), e;
}
chrome.storage.onChanged.addListener((e, t) => {
  t === "local" && (e.imagionApiKey || e.imagionDetectionEndpoint) && (console.info(s, "Config changed, clearing cache"), b = null, e.imagionApiKey && !e.imagionApiKey.newValue && A(null));
});
chrome.runtime.onMessage.addListener((e, t, o) => !e || typeof e.type != "string" ? !1 : e.type === "REQUEST_DETECTION" ? (console.debug(s, "Received detection request:", e.badgeId, e.imageUrl?.substring(0, 80)), X(e, o), !0) : e.type === $ ? ((async () => {
  try {
    const r = await ie();
    o({ success: !0, usage: r });
  } catch (r) {
    console.error(s, "Usage status failed:", r), o({
      success: !1,
      error: r instanceof Error ? r.message : "Failed to load usage status"
    });
  }
})(), !0) : !1);
function X(e, t) {
  const o = j(e.imageUrl, e.pageUrl);
  if (!o) {
    console.warn(s, "Invalid URL:", e.imageUrl), t({
      status: "error",
      message: "Unable to resolve image URL.",
      badgeId: e.badgeId,
      imageUrl: e.imageUrl
    });
    return;
  }
  const r = Y(o);
  if (r) {
    console.debug(s, "Cache hit for:", e.badgeId), t({ ...r, badgeId: e.badgeId, imageUrl: o });
    return;
  }
  const a = S.get(o);
  if (a) {
    console.debug(s, "Joining existing request for:", e.badgeId), a.resolvers.push({ badgeId: e.badgeId, sendResponse: t });
    return;
  }
  console.debug(s, "Queueing new request for:", e.badgeId), S.set(o, { resolvers: [{ badgeId: e.badgeId, sendResponse: t }] }), w.push({ imageUrl: o }), R();
}
function j(e, t) {
  if (!e)
    return null;
  try {
    return new URL(e, t || void 0).toString();
  } catch (o) {
    return console.warn(s, "Invalid image URL", e, o), null;
  }
}
function Y(e) {
  const t = T.get(e);
  return t ? Date.now() - t.timestamp > 3e5 ? (T.delete(e), null) : t.payload : null;
}
function R() {
  if (Date.now() < h) {
    console.debug(s, "Rate limited, waiting...");
    return;
  }
  for (; I < 3 && w.length > 0; ) {
    const e = w.shift();
    e && (I += 1, console.debug(s, `Processing queue (${I}/3 running, ${w.length} pending)`), q(e.imageUrl).catch(() => {
    }).finally(() => {
      I -= 1, R();
    }));
  }
}
async function q(e) {
  const { imagionApiKey: t, imagionDetectionEndpoint: o } = await C();
  if (!t) {
    console.warn(s, "No API key configured"), p({
      level: "warning",
      message: "missing_api_key",
      details: { imageUrl: e }
    }), d(e, {
      status: "missing-key",
      message: "Please provide an Imagion API key in the options page."
    });
    return;
  }
  let r;
  try {
    console.debug(s, "Fetching image:", e.substring(0, 80)), r = await z(e), console.debug(s, "Image fetched, size:", r.size, "bytes");
  } catch (n) {
    const i = n instanceof Error ? n.message : String(n);
    console.error(s, "Failed to fetch image:", {
      imageUrl: e,
      error: i,
      errorType: n instanceof Error ? n.name : typeof n,
      stack: n instanceof Error ? n.stack : void 0
    }), p({
      level: "error",
      message: "fetch_image_failed",
      details: { imageUrl: e, error: i }
    }), d(e, {
      status: "error",
      message: `Failed to fetch image: ${i}`
    });
    return;
  }
  let a = null;
  try {
    a = await ne(r);
  } catch (n) {
    console.warn(s, "Failed to hash image:", n);
  }
  if (a) {
    const n = await ee(a);
    if (n) {
      p({
        level: "info",
        message: "local_history_hit",
        details: { imageUrl: e, hash: a }
      });
      const i = { ...n.payload, status: n.payload.status || "success" };
      T.set(e, { timestamp: Date.now(), payload: i }), d(e, i, a);
      return;
    }
  }
  const y = re(o);
  if (a && t) {
    const n = await ae(a, y, t);
    if (n) {
      p({
        level: "info",
        message: "remote_cache_hit",
        details: { imageUrl: e, hash: a }
      });
      const i = { ...n, status: n.status || "success" };
      T.set(e, { timestamp: Date.now(), payload: i }), H(a, i), d(e, i, a);
      return;
    }
  }
  const D = new FormData(), B = G(e), x = new File([r], B, { type: r.type || "image/jpeg" });
  D.append("file", x);
  let c;
  try {
    console.debug(s, "Sending to API:", o), c = await fetch(o, {
      method: "POST",
      headers: {
        "x-api-key": t,
        "x-detection-source": "extension"
      },
      body: D
    }), console.debug(s, "API response status:", c.status);
  } catch (n) {
    const i = n instanceof Error ? n.message : String(n);
    console.error(s, "API request failed:", {
      imageUrl: e,
      endpoint: o,
      error: i,
      errorType: n instanceof Error ? n.name : typeof n,
      stack: n instanceof Error ? n.stack : void 0
    }), p({
      level: "error",
      message: "detection_request_failed",
      details: { imageUrl: e, error: i }
    }), d(e, {
      status: "error",
      message: `API request failed: ${i}`
    }, a ?? void 0);
    return;
  }
  let f;
  try {
    f = await c.json(), console.debug(s, "API response payload:", f);
  } catch (n) {
    const i = n instanceof Error ? n.message : String(n);
    console.error(s, "Failed to parse API response JSON:", {
      imageUrl: e,
      status: c.status,
      statusText: c.statusText,
      contentType: c.headers.get("content-type"),
      error: i
    }), p({
      level: "error",
      message: "invalid_json",
      details: { imageUrl: e, status: c.status, error: i }
    }), d(e, {
      status: "error",
      message: `Failed to parse response (status ${c.status}): ${i}`
    }, a ?? void 0);
    return;
  }
  if (c.status === 429) {
    const n = f, i = Q(c.headers.get("Retry-After")), m = n.retryAfter ?? i, N = n.errorType === "PLAN_LIMIT_EXCEEDED" ? "plan" : n.errorType === "DAILY_RATE_LIMIT_EXCEEDED" ? "daily" : "burst";
    J(m, N), console.warn(s, "Rate limited, retry after:", m, "seconds"), p({
      level: "warning",
      message: "rate_limited",
      details: {
        imageUrl: e,
        retryAfter: m,
        badgeLabel: n.badgeLabel,
        errorType: n.errorType
      }
    }), d(e, {
      status: "rate-limit",
      message: n.message ?? `Rate limit exceeded. Retrying in ${m} seconds.`,
      retryAfterSeconds: m,
      badgeLabel: n.badgeLabel,
      errorType: n.errorType
    }, a ?? void 0);
    return;
  }
  if (!c.ok) {
    const n = f, i = n.message || n.error || "Detection failed";
    console.error(s, "API error response:", {
      status: c.status,
      statusText: c.statusText,
      message: i,
      imageUrl: e,
      fullResponse: n
    }), p({
      level: "error",
      message: "detection_error",
      details: { imageUrl: e, responseStatus: c.status, message: i, fullResponse: n }
    }), d(e, {
      status: "error",
      message: i
    }, a ?? void 0);
    return;
  }
  const l = f;
  if (!l.verdict) {
    const n = l.message || l.error || "API returned no verdict. The image may be unsupported or corrupted.";
    console.error(s, "API returned success but no verdict:", {
      imageUrl: e,
      responseStatus: c.status,
      payload: l,
      rawPayload: f
    }), p({
      level: "error",
      message: "no_verdict_returned",
      details: { imageUrl: e, responseStatus: c.status, rawPayload: f }
    }), d(e, {
      status: "error",
      message: n
    }, a ?? void 0);
    return;
  }
  const M = {
    status: "success",
    verdict: l.verdict,
    score: l.score,
    confidence: l.confidence,
    presentation: l.presentation
  };
  console.info(s, "Detection success:", l.verdict, "score:", l.score), p({
    level: "info",
    message: "detection_success",
    details: { imageUrl: e, score: l.score, verdict: l.verdict }
  }), T.set(e, { timestamp: Date.now(), payload: M }), a && H(a, M), d(e, M, a ?? void 0);
}
async function z(e) {
  const t = await fetch(e, {
    method: "GET",
    credentials: "omit"
  });
  if (!t.ok)
    throw new Error(`Unable to fetch image (${t.status})`);
  const o = await t.blob();
  if (!o || o.size === 0)
    throw new Error("Image payload was empty.");
  return o;
}
function G(e) {
  try {
    const o = new URL(e).pathname.split("/").filter(Boolean);
    return o[o.length - 1] || "imagion-image.jpg";
  } catch {
    return "imagion-image.jpg";
  }
}
function d(e, t, o) {
  const r = S.get(e);
  r && (console.debug(s, "Dispatching response to", r.resolvers.length, "resolver(s)"), r.resolvers.forEach(({ badgeId: a, sendResponse: y }) => {
    y({ ...t, badgeId: a, imageUrl: e, hash: o });
  }), S.delete(e));
}
function Q(e) {
  if (!e)
    return 15e3 / 1e3;
  const t = Number.parseInt(e, 10);
  return Number.isFinite(t) && t > 0 ? t : 15e3 / 1e3;
}
function J(e, t = "burst") {
  const o = Math.min(Math.max(e * 1e3, 15e3), 6e4);
  h = Date.now() + o, g && clearTimeout(g), t === "plan" && A({
    reason: t,
    expiresAt: h
  }), g = setTimeout(() => {
    h = 0, g = null, t === "plan" && A(null), R();
  }, o);
}
function O(e) {
  e ? (chrome.action.setBadgeText({ text: "!" }), chrome.action.setBadgeBackgroundColor({ color: F })) : (chrome.action.setBadgeText({ text: "" }), chrome.action.setBadgeBackgroundColor({ color: "#000000" }));
}
function U(e) {
  e ? chrome.storage.local.set({ [E]: e }) : chrome.storage.local.remove(E);
}
function A(e) {
  O(!!e), U(e);
}
function W(e) {
  if (!e || typeof e != "object")
    return !1;
  const t = e;
  return ["burst", "daily", "plan"].includes(t.reason) && typeof t.expiresAt == "number" && Number.isFinite(t.expiresAt);
}
function V() {
  return new Promise((e) => {
    chrome.storage.local.get(E, (t) => {
      const o = t[E];
      if (W(o) && o.expiresAt > Date.now()) {
        O(!0), h = o.expiresAt;
        const r = o.expiresAt - Date.now();
        r > 0 ? g = setTimeout(() => {
          h = 0, g = null, A(null), R();
        }, r) : A(null);
      } else
        chrome.storage.local.remove(E);
      e();
    });
  });
}
async function Z() {
  return new Promise((e) => {
    chrome.storage.local.get(v, (t) => {
      const o = t[v];
      Array.isArray(o) ? (u = o.filter(oe), u.length > 250 && (u = u.slice(0, 250))) : u = [], e();
    });
  });
}
async function k() {
  await K;
}
async function ee(e) {
  return await k(), u.find((t) => t.hash === e);
}
async function H(e, t) {
  await k(), u = u.filter((o) => o.hash !== e), u.unshift({ hash: e, payload: t, createdAt: Date.now() }), u.length > 250 && (u.length = 250), te();
}
function te() {
  chrome.storage.local.set({ [v]: u });
}
function oe(e) {
  if (typeof e != "object" || e === null)
    return !1;
  const t = e;
  return typeof t.hash == "string" && t.hash.length > 0 && typeof t.createdAt == "number" && typeof t.payload == "object" && t.payload !== null && typeof t.payload.status == "string";
}
async function ne(e) {
  const t = await e.arrayBuffer(), o = await crypto.subtle.digest("SHA-256", t);
  return Array.from(new Uint8Array(o)).map((a) => a.toString(16).padStart(2, "0")).join("");
}
function re(e) {
  try {
    const t = new URL(e);
    return t.pathname.endsWith("/api/detect") ? t.pathname = t.pathname.replace(/\/api\/detect$/, "/api/cache/hash") : t.pathname = `${t.pathname.replace(/\/$/, "")}/api/cache/hash`, t.toString();
  } catch {
    return `${e.replace(/\/$/, "")}/api/cache/hash`;
  }
}
async function ae(e, t, o) {
  try {
    const r = await fetch(t, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": o
      },
      body: JSON.stringify({ hash: e })
    });
    if (!r.ok)
      return null;
    const a = await r.json();
    if (a?.found && a.payload)
      return a.payload;
  } catch (r) {
    console.warn(s, "Backend cache lookup failed:", r);
  }
  return null;
}
function se(e) {
  try {
    const t = new URL(e);
    return t.pathname.endsWith("/api/detect") ? t.pathname = t.pathname.replace(/\/api\/detect$/, "/api/usage/status") : t.pathname = `${t.pathname.replace(/\/$/, "")}/api/usage/status`, t.toString();
  } catch {
    return `${e.replace(/\/$/, "")}/api/usage/status`;
  }
}
async function ie() {
  const { imagionApiKey: e, imagionDetectionEndpoint: t } = await C();
  if (!e)
    throw new Error("Missing Imagion API key");
  const o = se(t), r = await fetch(o, {
    method: "GET",
    headers: {
      "x-api-key": e
    }
  });
  if (!r.ok) {
    const y = await r.text();
    throw new Error(`Usage status request failed (${r.status}): ${y}`);
  }
  const a = await r.json();
  if (!a?.success || !a?.usage)
    throw new Error("Invalid usage status response");
  return a.usage;
}
function p(e) {
  _.push({ timestamp: Date.now(), ...e }), _.length > 40 && _.shift(), chrome.storage.local.set({ [P]: _ });
}
//# sourceMappingURL=background.js.map
