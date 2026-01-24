const r = "[Imagion Background]", w = "http://localhost:3000/api/detect";
const D = "imagionTelemetry";
console.log(r, "Service worker started");
const y = /* @__PURE__ */ new Map(), E = /* @__PURE__ */ new Map(), m = [], u = [];
let f = 0, h = null, I = 0, p = null;
async function M() {
  if (h)
    return h;
  const e = await new Promise((t) => {
    chrome.storage.local.get(
      {
        imagionApiKey: "",
        imagionDetectionEndpoint: w
      },
      (n) => {
        t({
          imagionApiKey: typeof n.imagionApiKey == "string" ? n.imagionApiKey.trim() : "",
          imagionDetectionEndpoint: typeof n.imagionDetectionEndpoint == "string" && n.imagionDetectionEndpoint.trim().length > 0 ? n.imagionDetectionEndpoint.trim() : w
        });
      }
    );
  });
  return h = e, console.log(r, "Config loaded:", {
    hasApiKey: !!e.imagionApiKey,
    endpoint: e.imagionDetectionEndpoint
  }), e;
}
chrome.storage.onChanged.addListener((e, t) => {
  t === "local" && (e.imagionApiKey || e.imagionDetectionEndpoint) && (console.log(r, "Config changed, clearing cache"), h = null);
});
chrome.runtime.onMessage.addListener((e, t, n) => !e || e.type !== "REQUEST_DETECTION" ? !1 : (console.log(r, "Received detection request:", e.badgeId, e.imageUrl?.substring(0, 80)), R(e, n), !0));
function R(e, t) {
  const n = S(e.imageUrl, e.pageUrl);
  if (!n) {
    console.warn(r, "Invalid URL:", e.imageUrl), t({
      status: "error",
      message: "Unable to resolve image URL.",
      badgeId: e.badgeId,
      imageUrl: e.imageUrl
    });
    return;
  }
  const i = v(n);
  if (i) {
    console.log(r, "Cache hit for:", e.badgeId), t({ ...i, badgeId: e.badgeId, imageUrl: n });
    return;
  }
  const c = E.get(n);
  if (c) {
    console.log(r, "Joining existing request for:", e.badgeId), c.resolvers.push({ badgeId: e.badgeId, sendResponse: t });
    return;
  }
  console.log(r, "Queueing new request for:", e.badgeId), E.set(n, { resolvers: [{ badgeId: e.badgeId, sendResponse: t }] }), m.push({ imageUrl: n }), _();
}
function S(e, t) {
  if (!e)
    return null;
  try {
    return new URL(e, t || void 0).toString();
  } catch (n) {
    return console.warn(r, "Invalid image URL", e, n), null;
  }
}
function v(e) {
  const t = y.get(e);
  return t ? Date.now() - t.timestamp > 3e5 ? (y.delete(e), null) : t.payload : null;
}
function _() {
  if (Date.now() < I) {
    console.log(r, "Rate limited, waiting...");
    return;
  }
  for (; f < 3 && m.length > 0; ) {
    const e = m.shift();
    e && (f += 1, console.log(r, `Processing queue (${f}/3 running, ${m.length} pending)`), C(e.imageUrl).catch(() => {
    }).finally(() => {
      f -= 1, _();
    }));
  }
}
async function C(e) {
  const { imagionApiKey: t, imagionDetectionEndpoint: n } = await M();
  if (!t) {
    console.warn(r, "No API key configured"), d({
      level: "warning",
      message: "missing_api_key",
      details: { imageUrl: e }
    }), l(e, {
      status: "missing-key",
      message: "Please provide an Imagion API key in the options page."
    });
    return;
  }
  let i;
  try {
    console.log(r, "Fetching image:", e.substring(0, 80)), i = await N(e), console.log(r, "Image fetched, size:", i.size, "bytes");
  } catch (o) {
    console.error(r, "Failed to fetch image:", o), d({
      level: "error",
      message: "fetch_image_failed",
      details: { imageUrl: e, error: o instanceof Error ? o.message : String(o) }
    }), l(e, {
      status: "error",
      message: o instanceof Error ? o.message : "Unable to fetch the image."
    });
    return;
  }
  const c = new FormData(), A = F(e), b = new File([i], A, { type: i.type || "image/jpeg" });
  c.append("file", b);
  let s;
  try {
    console.log(r, "Sending to API:", n), s = await fetch(n, {
      method: "POST",
      headers: {
        "x-api-key": t
      },
      body: c
    }), console.log(r, "API response status:", s.status);
  } catch (o) {
    console.error(r, "API request failed:", o), d({
      level: "error",
      message: "detection_request_failed",
      details: { imageUrl: e, error: o instanceof Error ? o.message : String(o) }
    }), l(e, {
      status: "error",
      message: o instanceof Error ? o.message : "Detection request failed."
    });
    return;
  }
  let g;
  try {
    g = await s.json(), console.log(r, "API response payload:", g);
  } catch (o) {
    console.error(r, "Failed to parse JSON:", o), d({
      level: "error",
      message: "invalid_json",
      details: { imageUrl: e, error: o instanceof Error ? o.message : String(o) }
    }), l(e, {
      status: "error",
      message: o instanceof Error ? o.message : "Unable to parse detection response."
    });
    return;
  }
  if (s.status === 429) {
    const o = O(s.headers.get("Retry-After"));
    L(o), console.warn(r, "Rate limited, retry after:", o, "seconds"), d({
      level: "warning",
      message: "rate_limited",
      details: { imageUrl: e, retryAfter: o }
    }), l(e, {
      status: "rate-limit",
      message: `Rate limit exceeded. Retrying in ${o} seconds.`,
      retryAfterSeconds: o
    });
    return;
  }
  if (!s.ok) {
    const o = g?.message || "Detection failed";
    console.error(r, "API error:", s.status, o), d({
      level: "error",
      message: "detection_error",
      details: { imageUrl: e, responseStatus: s.status, message: o }
    }), l(e, {
      status: "error",
      message: o
    });
    return;
  }
  const a = g, T = {
    status: "success",
    verdict: a.verdict,
    score: a.score,
    confidence: a.confidence,
    presentation: a.presentation
  };
  console.log(r, "Detection success:", a.verdict, "score:", a.score), d({
    level: "info",
    message: "detection_success",
    details: { imageUrl: e, score: a.score, verdict: a.verdict }
  }), y.set(e, { timestamp: Date.now(), payload: T }), l(e, T);
}
async function N(e) {
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
function F(e) {
  try {
    const n = new URL(e).pathname.split("/").filter(Boolean);
    return n[n.length - 1] || "imagion-image.jpg";
  } catch {
    return "imagion-image.jpg";
  }
}
function l(e, t) {
  const n = E.get(e);
  n && (console.log(r, "Dispatching response to", n.resolvers.length, "resolver(s)"), n.resolvers.forEach(({ badgeId: i, sendResponse: c }) => {
    c({ ...t, badgeId: i, imageUrl: e });
  }), E.delete(e));
}
function O(e) {
  if (!e)
    return 15e3 / 1e3;
  const t = Number.parseInt(e, 10);
  return Number.isFinite(t) && t > 0 ? t : 15e3 / 1e3;
}
function L(e) {
  const t = Math.min(Math.max(e * 1e3, 15e3), 6e4);
  I = Date.now() + t, p && clearTimeout(p), p = setTimeout(() => {
    I = 0, p = null, _();
  }, t);
}
function d(e) {
  u.push({ timestamp: Date.now(), ...e }), u.length > 40 && u.shift(), chrome.storage.local.set({ [D]: u });
}
//# sourceMappingURL=background.js.map
