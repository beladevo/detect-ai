const w = "http://localhost:3000/api/detect";
const D = "imagionTelemetry";
const E = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Map(), h = [], d = [];
let p = 0, f = null, y = 0, u = null;
async function b() {
  if (f)
    return f;
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
  return f = e, e;
}
chrome.storage.onChanged.addListener((e, t) => {
  t === "local" && (e.imagionApiKey || e.imagionDetectionEndpoint) && (f = null);
});
chrome.runtime.onMessage.addListener((e, t, n) => !e || e.type !== "REQUEST_DETECTION" ? !1 : (A(e, n), !0));
function A(e, t) {
  const n = S(e.imageUrl, e.pageUrl);
  if (!n) {
    t({
      status: "error",
      message: "Unable to resolve image URL.",
      badgeId: e.badgeId,
      imageUrl: e.imageUrl
    });
    return;
  }
  const o = v(n);
  if (o) {
    t({ ...o, badgeId: e.badgeId, imageUrl: n });
    return;
  }
  const i = g.get(n);
  if (i) {
    i.resolvers.push({ badgeId: e.badgeId, sendResponse: t });
    return;
  }
  g.set(n, { resolvers: [{ badgeId: e.badgeId, sendResponse: t }] }), h.push({ imageUrl: n }), _();
}
function S(e, t) {
  if (!e)
    return null;
  try {
    return new URL(e, t || void 0).toString();
  } catch (n) {
    return console.warn("Invalid image URL", e, n), null;
  }
}
function v(e) {
  const t = E.get(e);
  return t ? Date.now() - t.timestamp > 3e5 ? (E.delete(e), null) : t.payload : null;
}
function _() {
  if (!(Date.now() < y))
    for (; p < 3 && h.length > 0; ) {
      const e = h.shift();
      e && (p += 1, R(e.imageUrl).catch(() => {
      }).finally(() => {
        p -= 1, _();
      }));
    }
}
async function R(e) {
  const { imagionApiKey: t, imagionDetectionEndpoint: n } = await b();
  if (!t) {
    a({
      level: "warning",
      message: "missing_api_key",
      details: { imageUrl: e }
    }), s(e, {
      status: "missing-key",
      message: "Please provide an Imagion API key in the options page."
    });
    return;
  }
  let o;
  try {
    o = await C(e);
  } catch (r) {
    a({
      level: "error",
      message: "fetch_image_failed",
      details: { imageUrl: e, error: r instanceof Error ? r.message : String(r) }
    }), s(e, {
      status: "error",
      message: r instanceof Error ? r.message : "Unable to fetch the image."
    });
    return;
  }
  const i = new FormData(), I = N(e), M = new File([o], I, { type: o.type || "image/jpeg" });
  i.append("file", M);
  let c;
  try {
    c = await fetch(n, {
      method: "POST",
      headers: {
        "x-api-key": t
      },
      body: i
    });
  } catch (r) {
    a({
      level: "error",
      message: "detection_request_failed",
      details: { imageUrl: e, error: r instanceof Error ? r.message : String(r) }
    }), s(e, {
      status: "error",
      message: r instanceof Error ? r.message : "Detection request failed."
    });
    return;
  }
  let m;
  try {
    m = await c.json();
  } catch (r) {
    a({
      level: "error",
      message: "invalid_json",
      details: { imageUrl: e, error: r instanceof Error ? r.message : String(r) }
    }), s(e, {
      status: "error",
      message: r instanceof Error ? r.message : "Unable to parse detection response."
    });
    return;
  }
  if (c.status === 429) {
    const r = F(c.headers.get("Retry-After"));
    L(r), a({
      level: "warning",
      message: "rate_limited",
      details: { imageUrl: e, retryAfter: r }
    }), s(e, {
      status: "rate-limit",
      message: `Rate limit exceeded. Retrying in ${r} seconds.`,
      retryAfterSeconds: r
    });
    return;
  }
  if (!c.ok) {
    const r = m?.message || "Detection failed";
    a({
      level: "error",
      message: "detection_error",
      details: { imageUrl: e, responseStatus: c.status, message: r }
    }), s(e, {
      status: "error",
      message: r
    });
    return;
  }
  const l = m, T = {
    status: "success",
    verdict: l.verdict,
    score: l.score,
    confidence: l.confidence,
    presentation: l.presentation
  };
  a({
    level: "info",
    message: "detection_success",
    details: { imageUrl: e, score: l.score, verdict: l.verdict }
  }), E.set(e, { timestamp: Date.now(), payload: T }), s(e, T);
}
async function C(e) {
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
function N(e) {
  try {
    const n = new URL(e).pathname.split("/").filter(Boolean);
    return n[n.length - 1] || "imagion-image.jpg";
  } catch {
    return "imagion-image.jpg";
  }
}
function s(e, t) {
  const n = g.get(e);
  n && (n.resolvers.forEach(({ badgeId: o, sendResponse: i }) => {
    i({ ...t, badgeId: o, imageUrl: e });
  }), g.delete(e));
}
function F(e) {
  if (!e)
    return 15e3 / 1e3;
  const t = Number.parseInt(e, 10);
  return Number.isFinite(t) && t > 0 ? t : 15e3 / 1e3;
}
function L(e) {
  const t = Math.min(Math.max(e * 1e3, 15e3), 6e4);
  y = Date.now() + t, u && clearTimeout(u), u = setTimeout(() => {
    y = 0, u = null, _();
  }, t);
}
function a(e) {
  d.push({ timestamp: Date.now(), ...e }), d.length > 40 && d.shift(), chrome.storage.local.set({ [D]: d });
}
//# sourceMappingURL=background.js.map
