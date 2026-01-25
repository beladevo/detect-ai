(function(){"use strict";const r="[Imagion Content]",_="imagion-badge-style",R=["localhost","127.0.0.1","imagion.ai","www.imagion.ai"],d=new Map;let z=0,g=!1,p=!1;const u={enabled:!0},x={en:{aiLabel:"AI",realLabel:"Real",errorLabel:"Error",loginLabel:"Log in",badgePrefix:"Imagion badge",tooltipFallback:"Imagion verdict",rateLimitLabel:"Rate limited",disabledHostMessage:"Badges paused on this host."},es:{aiLabel:"IA",realLabel:"Real",errorLabel:"Error",loginLabel:"Iniciar sesión",badgePrefix:"Insignia Imagion",tooltipFallback:"Veredicto de Imagion",rateLimitLabel:"Límite de velocidad",disabledHostMessage:"Insignias pausadas en este host."}},w=navigator.language.split("-")[0],s=x[w]??x.en,B=`
.imagion-wrapper {
  position: relative !important;
  display: inline-block !important;
}
.imagion-badge {
  position: absolute !important;
  top: 6px !important;
  right: 6px !important;
  pointer-events: auto !important;
  cursor: default !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  padding: 3px 8px !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  border-radius: 4px !important;
  background: rgba(100, 100, 100, 0.9) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
  letter-spacing: 0.02em !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  text-transform: uppercase !important;
  white-space: nowrap !important;
  margin: 0 !important;
  border: none !important;
  text-decoration: none !important;
  line-height: 1.2 !important;
  z-index: 10000 !important;
}
.imagion-badge__logo {
  width: 14px !important;
  height: 14px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 3px !important;
  background: #fff !important;
  color: #1a1a2e !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  margin: 0 !important;
  padding: 0 !important;
}
.imagion-badge__label {
  line-height: 1 !important;
}
.imagion-badge--pending {
  background: rgba(100, 100, 100, 0.9) !important;
}
.imagion-badge--ai {
  background: rgba(220, 53, 69, 0.95) !important;
}
.imagion-badge--real {
  background: rgba(40, 167, 69, 0.95) !important;
}
.imagion-badge--error {
  background: rgba(255, 69, 96, 0.9) !important;
}
.imagion-badge--missing-key {
  background: rgba(255, 193, 7, 0.95) !important;
  color: #1a1a1a !important;
}

/* Hover Card Styles - MagicUI inspired */
.imagion-hover-card {
  position: absolute !important;
  top: 100% !important;
  right: 0 !important;
  margin-top: 8px !important;
  min-width: 220px !important;
  max-width: 280px !important;
  padding: 12px 14px !important;
  background: rgba(15, 15, 20, 0.85) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 10px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  color: #fff !important;
  z-index: 10001 !important;
  opacity: 0 !important;
  visibility: hidden !important;
  transform: translateY(-4px) !important;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s !important;
  pointer-events: none !important;
}
.imagion-badge:hover .imagion-hover-card {
  opacity: 1 !important;
  visibility: visible !important;
  transform: translateY(0) !important;
  pointer-events: auto !important;
}
.imagion-hover-card__header {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin-bottom: 10px !important;
  padding-bottom: 8px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}
.imagion-hover-card__verdict {
  font-size: 14px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
}
.imagion-hover-card__verdict--ai {
  color: #ff6b7a !important;
}
.imagion-hover-card__verdict--real {
  color: #6bff8e !important;
}
.imagion-hover-card__verdict--error {
  color: #ffaa6b !important;
}
.imagion-hover-card__row {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-bottom: 6px !important;
  font-size: 12px !important;
}
.imagion-hover-card__label {
  color: rgba(255, 255, 255, 0.6) !important;
  font-weight: 400 !important;
}
.imagion-hover-card__value {
  color: #fff !important;
  font-weight: 500 !important;
}
.imagion-hover-card__bar {
  height: 4px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 2px !important;
  overflow: hidden !important;
  margin-top: 4px !important;
  margin-bottom: 8px !important;
}
.imagion-hover-card__bar-fill {
  height: 100% !important;
  border-radius: 2px !important;
  transition: width 0.3s ease !important;
}
.imagion-hover-card__bar-fill--ai {
  background: linear-gradient(90deg, #ff6b7a, #ff4d67) !important;
}
.imagion-hover-card__bar-fill--real {
  background: linear-gradient(90deg, #6bff8e, #28a745) !important;
}
.imagion-hover-card__hash {
  margin-top: 10px !important;
  padding-top: 8px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  font-size: 9px !important;
  color: rgba(255, 255, 255, 0.35) !important;
  font-family: "SF Mono", Monaco, "Cascadia Code", monospace !important;
  word-break: break-all !important;
  line-height: 1.4 !important;
}
.imagion-hover-card__hash-label {
  color: rgba(255, 255, 255, 0.5) !important;
  font-size: 9px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  margin-bottom: 2px !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}
.imagion-hover-card__message {
  font-size: 11px !important;
  color: rgba(255, 255, 255, 0.7) !important;
  line-height: 1.4 !important;
  margin-top: 6px !important;
}
`;function $(){if(document.getElementById(_))return;const t=document.createElement("style");t.id=_,t.textContent=B,(document.head||document.documentElement).appendChild(t),console.debug(r,"Badge styles injected")}function f(){g||(g=!0,requestAnimationFrame(()=>{g=!1,H()}))}function y(){p||(p=!0,requestAnimationFrame(()=>{p=!1,k()}))}function H(){for(const[t,e]of d)t.isConnected||(L(t,e),d.delete(t))}function L(t,e){const{badge:a,wrapper:i}=e;a.remove(),i.parentNode&&(i.parentNode.insertBefore(t,i),i.remove())}function S(t){const e=t.toLowerCase();return R.some(a=>e===a||e.endsWith(`.${a}`))}function I(){return!u.enabled||E(window.location.hostname)||S(window.location.hostname)}function k(){if(I()){console.debug(r,"Scanning skipped (disabled or host blocked)"),h();return}const t=Array.from(document.images),e=t.filter(a=>D(a));e.length>0&&console.debug(r,`Found ${e.length} new images to track (total on page: ${t.length})`);for(const a of e)q(a)}function D(t){if(d.has(t)||d.size>=200||!t.src||t.src.startsWith("data:"))return!1;const e=t.getBoundingClientRect();return!(e.width<50||e.height<50||e.width===0||e.height===0)}function q(t){const e=document.createElement("div");e.className="imagion-badge imagion-badge--pending",e.setAttribute("role","status"),e.setAttribute("lang",w),e.innerHTML='<span class="imagion-badge__logo">I</span><span class="imagion-badge__label">...</span>',l(e,"Analyzing"),e.dataset.requestState="pending";const a=`imagion-${++z}`;e.dataset.requestId=a;const i=document.createElement("span");i.className="imagion-wrapper";const n=window.getComputedStyle(t).zIndex;n&&n!=="auto"&&(i.style.zIndex=n);const o=t.parentNode;o&&(o.insertBefore(i,t),i.appendChild(t),i.appendChild(e)),d.set(t,{badge:e,wrapper:i}),U(t,e,a)}function U(t,e,a){const i=t.currentSrc||t.src;if(!i||i.startsWith("data:")){console.debug(r,`Skipping data URI for ${a}`),b(e,{status:"error",message:"Unable to analyze data URI.",badgeId:a});return}console.debug(r,`Requesting detection for ${a}:`,i.substring(0,100));const c={type:"REQUEST_DETECTION",imageUrl:i,badgeId:a,pageUrl:window.location.href};N(c).then(n=>{console.debug(r,`Response for ${a}:`,n.status,n.verdict||n.message),b(e,n)}).catch(n=>{console.error(r,`Error for ${a}:`,n),b(e,{status:"error",message:n?.message||"Detection request failed.",badgeId:a})})}function N(t){return new Promise(e=>{chrome.runtime.sendMessage(t,a=>{if(chrome.runtime.lastError){console.error(r,"Runtime error:",chrome.runtime.lastError.message),e({status:"error",message:chrome.runtime.lastError.message,badgeId:t.badgeId});return}e(a)})})}function b(t,e){if(!t||!e||t.dataset.requestId!==e.badgeId)return;const a=t.querySelector(".imagion-badge__label");if(!a)return;t.classList.remove("imagion-badge--pending","imagion-badge--ai","imagion-badge--real","imagion-badge--error","imagion-badge--missing-key");const i=t.querySelector(".imagion-hover-card");if(i&&i.remove(),(e.status==="success"||e.status===void 0)&&e.verdict){const o=e.verdict.toLowerCase();o==="ai"||o==="fake"||o==="ai_generated"||o==="likely_ai"?(t.classList.add("imagion-badge--ai"),a.textContent=s.aiLabel,l(t,s.aiLabel)):(t.classList.add("imagion-badge--real"),a.textContent=s.realLabel,l(t,s.realLabel)),t.dataset.requestState="success"}else if(e.status==="missing-key")t.classList.add("imagion-badge--missing-key"),a.textContent=s.loginLabel,l(t,s.loginLabel),t.dataset.requestState="key-required";else if(e.status==="rate-limit"){const o=e.badgeLabel??s.rateLimitLabel;t.classList.add("imagion-badge--error"),a.textContent=o,l(t,o),t.dataset.requestState="rate-limit"}else console.error(r,`Badge error for ${e.badgeId}:`,{status:e.status,verdict:e.verdict,message:e.message,imageUrl:e.imageUrl,fullResponse:e}),t.classList.add("imagion-badge--error"),a.textContent=s.errorLabel,l(t,s.errorLabel),t.dataset.requestState="error";t.title="";const n=T(e);t.appendChild(n)}function l(t,e){t.setAttribute("aria-label",`${s.badgePrefix}: ${e}`)}function T(t){const e=document.createElement("div");e.className="imagion-hover-card";const a=t.verdict?.toLowerCase()||"",i=a==="ai"||a==="fake"||a==="ai_generated"||a==="likely_ai",c=(t.status==="success"||t.status===void 0)&&t.verdict;let n="";if(c?n+=`<div class="imagion-hover-card__header">
      <span class="imagion-hover-card__verdict ${i?"imagion-hover-card__verdict--ai":"imagion-hover-card__verdict--real"}">${i?"AI Generated":"Real Image"}</span>
    </div>`:(t.status==="error"||t.status==="rate-limit")&&(n+=`<div class="imagion-hover-card__header">
      <span class="imagion-hover-card__verdict imagion-hover-card__verdict--error">${t.status==="rate-limit"?"Rate Limited":"Error"}</span>
    </div>`),t.score!=null&&c){const o=Number(t.score),m=o>1?Math.round(o):Math.round(o*100);n+=`<div class="imagion-hover-card__row">
      <span class="imagion-hover-card__label">AI Score</span>
      <span class="imagion-hover-card__value">${m}%</span>
    </div>
    <div class="imagion-hover-card__bar">
      <div class="imagion-hover-card__bar-fill ${i?"imagion-hover-card__bar-fill--ai":"imagion-hover-card__bar-fill--real"}" style="width: ${Math.min(m,100)}%"></div>
    </div>`}if(t.confidence!=null&&c){const o=Number(t.confidence),m=o>1?Math.round(o):Math.round(o*100);n+=`<div class="imagion-hover-card__row">
      <span class="imagion-hover-card__label">Confidence</span>
      <span class="imagion-hover-card__value">${m}%</span>
    </div>`}if(!c){const o=t.message||"Detection failed. Please try again.";n+=`<div class="imagion-hover-card__message">${F(o)}</div>`}if(t.hash){const o=t.hash.substring(0,16)+"..."+t.hash.substring(t.hash.length-8);n+=`<div class="imagion-hover-card__hash">
      <div class="imagion-hover-card__hash-label">SHA-256</div>
      ${o}
    </div>`}return e.innerHTML=n,e}function F(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function h(){const t=d.size;for(const[e,a]of d)L(e,a);d.clear(),t>0&&console.debug(r,`Removed ${t} badges`)}function P(t){const a=(Array.isArray(t.imagionDisabledHosts)?t.imagionDisabledHosts:[]).map(i=>C(i)).filter(i=>!!i);v=new Set(a),a.length>0&&console.info(r,"Disabled hosts:",a)}function C(t){const e=t.trim();if(!e)return null;try{return(e.includes("://")?new URL(e):new URL(`https://${e}`)).hostname.toLowerCase()}catch{return e.toLowerCase()}}function E(t){const e=C(t);if(!e)return!1;const a=e.startsWith("www.")?e.slice(4):e;return v.has(e)||v.has(a)}let v=new Set;function M(){chrome.storage.local.get({imagionBadgeEnabled:!0,imagionDisabledHosts:[]},t=>{const e=t.imagionBadgeEnabled!==!1;if(u.enabled=e,P(t),console.info(r,"Settings synced:",{enabled:e,hostBlocked:E(window.location.hostname)}),I()){h();return}u.enabled?y():h()})}function A(){if(console.info(r,"Initializing on",window.location.hostname),S(window.location.hostname)){console.info(r,"Skipping on excluded domain:",window.location.hostname);return}$(),M(),setTimeout(()=>{k(),f()},500);const t=document.documentElement||document.body;t&&(new MutationObserver(()=>y()).observe(t,{childList:!0,subtree:!0}),console.debug(r,"MutationObserver attached")),window.addEventListener("scroll",f,{passive:!0}),window.addEventListener("resize",f),chrome.storage.onChanged.addListener(M),console.info(r,"Initialization complete")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",A):A()})();
//# sourceMappingURL=content.js.map
