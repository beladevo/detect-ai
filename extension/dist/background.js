const r = "[Imagion Background]", H = "http://localhost:3000/api/detect";
const O = "imagionTelemetry";
const I = "recentImageHistory";
console.log(r, "Service worker started");
const h = /* @__PURE__ */ new Map(), A = /* @__PURE__ */ new Map(), E = [], p = [];
let y = 0, _ = null, T = 0, m = null, i = [];
const N = $();
async function F() {
  if (_)
    return _;
  const e = await new Promise((t) => {
    chrome.storage.local.get(
      {
        imagionApiKey: "",
        imagionDetectionEndpoint: H
      },
      (n) => {
        t({
          imagionApiKey: typeof n.imagionApiKey == "string" ? n.imagionApiKey.trim() : "",
          imagionDetectionEndpoint: typeof n.imagionDetectionEndpoint == "string" && n.imagionDetectionEndpoint.trim().length > 0 ? n.imagionDetectionEndpoint.trim() : H
        });
      }
    );
  });
  return _ = e, console.log(r, "Config loaded:", {
    hasApiKey: !!e.imagionApiKey,
    endpoint: e.imagionDetectionEndpoint
  }), e;
}
chrome.storage.onChanged.addListener((e, t) => {
  t === "local" && (e.imagionApiKey || e.imagionDetectionEndpoint) && (console.log(r, "Config changed, clearing cache"), _ = null);
});
chrome.runtime.onMessage.addListener((e, t, n) => !e || e.type !== "REQUEST_DETECTION" ? !1 : (console.log(r, "Received detection request:", e.badgeId, e.imageUrl?.substring(0, 80)), k(e, n), !0));
function k(e, t) {
  const n = P(e.imageUrl, e.pageUrl);
  if (!n) {
    console.warn(r, "Invalid URL:", e.imageUrl), t({
      status: "error",
      message: "Unable to resolve image URL.",
      badgeId: e.badgeId,
      imageUrl: e.imageUrl
    });
    return;
  }
  const s = B(n);
  if (s) {
    console.log(r, "Cache hit for:", e.badgeId), t({ ...s, badgeId: e.badgeId, imageUrl: n });
    return;
  }
  const a = A.get(n);
  if (a) {
    console.log(r, "Joining existing request for:", e.badgeId), a.resolvers.push({ badgeId: e.badgeId, sendResponse: t });
    return;
  }
  console.log(r, "Queueing new request for:", e.badgeId), A.set(n, { resolvers: [{ badgeId: e.badgeId, sendResponse: t }] }), E.push({ imageUrl: n }), S();
}
function P(e, t) {
  if (!e)
    return null;
  try {
    return new URL(e, t || void 0).toString();
  } catch (n) {
    return console.warn(r, "Invalid image URL", e, n), null;
  }
}
function B(e) {
  const t = h.get(e);
  return t ? Date.now() - t.timestamp > 3e5 ? (h.delete(e), null) : t.payload : null;
}
function S() {
  if (Date.now() < T) {
    console.log(r, "Rate limited, waiting...");
    return;
  }
  for (; y < 3 && E.length > 0; ) {
    const e = E.shift();
    e && (y += 1, console.log(r, `Processing queue (${y}/3 running, ${E.length} pending)`), K(e.imageUrl).catch(() => {
    }).finally(() => {
      y -= 1, S();
    }));
  }
}
async function K(e) {
  const { imagionApiKey: t, imagionDetectionEndpoint: n } = await F();
  if (!t) {
    console.warn(r, "No API key configured"), l({
      level: "warning",
      message: "missing_api_key",
      details: { imageUrl: e }
    }), c(e, {
      status: "missing-key",
      message: "Please provide an Imagion API key in the options page."
    });
    return;
  }
  let s;
  try {
    console.log(r, "Fetching image:", e.substring(0, 80)), s = await j(e), console.log(r, "Image fetched, size:", s.size, "bytes");
  } catch (o) {
    console.error(r, "Failed to fetch image:", o), l({
      level: "error",
      message: "fetch_image_failed",
      details: { imageUrl: e, error: o instanceof Error ? o.message : String(o) }
    }), c(e, {
      status: "error",
      message: o instanceof Error ? o.message : "Unable to fetch the image."
    });
    return;
  }
  let a = null;
  try {
    a = await J(s);
  } catch (o) {
    console.warn(r, "Failed to hash image:", o);
  }
  if (a) {
    const o = await q(a);
    if (o) {
      l({
        level: "info",
        message: "local_history_hit",
        details: { imageUrl: e, hash: a }
      }), h.set(e, { timestamp: Date.now(), payload: o.payload }), c(e, o.payload);
      return;
    }
  }
  const D = G(n);
  if (a && t) {
    const o = await U(a, D, t);
    if (o) {
      l({
        level: "info",
        message: "remote_cache_hit",
        details: { imageUrl: e, hash: a }
      }), h.set(e, { timestamp: Date.now(), payload: o }), R(a, o), c(e, o);
      return;
    }
  }
  const b = new FormData(), v = X(e), C = new File([s], v, { type: s.type || "image/jpeg" });
  b.append("file", C);
  let d;
  try {
    console.log(r, "Sending to API:", n), d = await fetch(n, {
      method: "POST",
      headers: {
        "x-api-key": t,
        "x-detection-source": "extension"
      },
      body: b
    }), console.log(r, "API response status:", d.status);
  } catch (o) {
    console.error(r, "API request failed:", o), l({
      level: "error",
      message: "detection_request_failed",
      details: { imageUrl: e, error: o instanceof Error ? o.message : String(o) }
    }), c(e, {
      status: "error",
      message: o instanceof Error ? o.message : "Detection request failed."
    });
    return;
  }
  let g;
  try {
    g = await d.json(), console.log(r, "API response payload:", g);
  } catch (o) {
    console.error(r, "Failed to parse JSON:", o), l({
      level: "error",
      message: "invalid_json",
      details: { imageUrl: e, error: o instanceof Error ? o.message : String(o) }
    }), c(e, {
      status: "error",
      message: o instanceof Error ? o.message : "Unable to parse detection response."
    });
    return;
  }
  if (d.status === 429) {
    const o = g, L = Y(d.headers.get("Retry-After")), f = o.retryAfter ?? L;
    x(f), console.warn(r, "Rate limited, retry after:", f, "seconds"), l({
      level: "warning",
      message: "rate_limited",
      details: { imageUrl: e, retryAfter: f, badgeLabel: o.badgeLabel }
    }), c(e, {
      status: "rate-limit",
      message: o.message ?? `Rate limit exceeded. Retrying in ${f} seconds.`,
      retryAfterSeconds: f,
      badgeLabel: o.badgeLabel
    });
    return;
  }
  if (!d.ok) {
    const o = g?.message || "Detection failed";
    console.error(r, "API error:", d.status, o), l({
      level: "error",
      message: "detection_error",
      details: { imageUrl: e, responseStatus: d.status, message: o }
    }), c(e, {
      status: "error",
      message: o
    });
    return;
  }
  const u = g, w = {
    status: "success",
    verdict: u.verdict,
    score: u.score,
    confidence: u.confidence,
    presentation: u.presentation
  };
  console.log(r, "Detection success:", u.verdict, "score:", u.score), l({
    level: "info",
    message: "detection_success",
    details: { imageUrl: e, score: u.score, verdict: u.verdict }
  }), h.set(e, { timestamp: Date.now(), payload: w }), a && R(a, w), c(e, w);
}
async function j(e) {
  const t = await fetch(e, {
    method: "GET",
    credentials: "omit"
  });
  if (!t.ok)
    throw new Error(`Unable to fetch image (${t.status})`);
  const n = await t.blob();
  if (!n || n.size === 0)
    throw new Error("Image payload was empty.");
  return n;
}
function X(e) {
  try {
    const n = new URL(e).pathname.split("/").filter(Boolean);
    return n[n.length - 1] || "imagion-image.jpg";
  } catch {
    return "imagion-image.jpg";
  }
}
function c(e, t) {
  const n = A.get(e);
  n && (console.log(r, "Dispatching response to", n.resolvers.length, "resolver(s)"), n.resolvers.forEach(({ badgeId: s, sendResponse: a }) => {
    a({ ...t, badgeId: s, imageUrl: e });
  }), A.delete(e));
}
function Y(e) {
  if (!e)
    return 15e3 / 1e3;
  const t = Number.parseInt(e, 10);
  return Number.isFinite(t) && t > 0 ? t : 15e3 / 1e3;
}
function x(e) {
  const t = Math.min(Math.max(e * 1e3, 15e3), 6e4);
  T = Date.now() + t, m && clearTimeout(m), m = setTimeout(() => {
    T = 0, m = null, S();
  }, t);
}
async function $() {
  return new Promise((e) => {
    chrome.storage.local.get(I, (t) => {
      const n = t[I];
      Array.isArray(n) ? (i = n.filter(Q), i.length > 250 && (i = i.slice(0, 250))) : i = [], e();
    });
  });
}
async function M() {
  await N;
}
async function q(e) {
  return await M(), i.find((t) => t.hash === e);
}
async function R(e, t) {
  await M(), i = i.filter((n) => n.hash !== e), i.unshift({ hash: e, payload: t, createdAt: Date.now() }), i.length > 250 && (i.length = 250), z();
}
function z() {
  chrome.storage.local.set({ [I]: i });
}
function Q(e) {
  if (typeof e != "object" || e === null)
    return !1;
  const t = e;
  return typeof t.hash == "string" && t.hash.length > 0 && typeof t.createdAt == "number" && typeof t.payload == "object" && t.payload !== null && typeof t.payload.status == "string";
}
async function J(e) {
  const t = await e.arrayBuffer(), n = await crypto.subtle.digest("SHA-256", t);
  return Array.from(new Uint8Array(n)).map((a) => a.toString(16).padStart(2, "0")).join("");
}
function G(e) {
  try {
    const t = new URL(e);
    return t.pathname.endsWith("/api/detect") ? t.pathname = t.pathname.replace(/\/api\/detect$/, "/api/cache/hash") : t.pathname = `${t.pathname.replace(/\/$/, "")}/api/cache/hash`, t.toString();
  } catch {
    return `${e.replace(/\/$/, "")}/api/cache/hash`;
  }
}
async function U(e, t, n) {
  try {
    const s = await fetch(t, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": n
      },
      body: JSON.stringify({ hash: e })
    });
    if (!s.ok)
      return null;
    const a = await s.json();
    if (a?.found && a.payload)
      return a.payload;
  } catch (s) {
    console.warn(r, "Backend cache lookup failed:", s);
  }
  return null;
}
function l(e) {
  p.push({ timestamp: Date.now(), ...e }), p.length > 40 && p.shift(), chrome.storage.local.set({ [O]: p });
}
//# sourceMappingURL=background.js.map
