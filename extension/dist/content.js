(function(){"use strict";const o="[Imagion Content]",b="imagion-badge-style",M=["localhost","127.0.0.1","imagion.ai","www.imagion.ai"],s=new Map;let R=0,c=!1,d=!1;const m={enabled:!0},h={en:{aiLabel:"AI",realLabel:"Real",errorLabel:"Error",loginLabel:"Log in",badgePrefix:"Imagion badge",tooltipFallback:"Imagion verdict",rateLimitLabel:"Rate limited",disabledHostMessage:"Badges paused on this host."},es:{aiLabel:"IA",realLabel:"Real",errorLabel:"Error",loginLabel:"Iniciar sesión",badgePrefix:"Insignia Imagion",tooltipFallback:"Veredicto de Imagion",rateLimitLabel:"Límite de velocidad",disabledHostMessage:"Insignias pausadas en este host."}},w=navigator.language.split("-")[0],i=h[w]??h.en,B=`
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
`;function D(){if(document.getElementById(b))return;const e=document.createElement("style");e.id=b,e.textContent=B,(document.head||document.documentElement).appendChild(e),console.log(o,"Badge styles injected")}function g(){c||(c=!0,requestAnimationFrame(()=>{c=!1,z()}))}function L(){d||(d=!0,requestAnimationFrame(()=>{d=!1,E()}))}function z(){for(const[e,t]of s)e.isConnected||(I(e,t),s.delete(e))}function I(e,t){const{badge:n,wrapper:a}=t;n.remove(),a.parentNode&&(a.parentNode.insertBefore(e,a),a.remove())}function S(e){const t=e.toLowerCase();return M.some(n=>t===n||t.endsWith(`.${n}`))}function y(){return!m.enabled||k(window.location.hostname)||S(window.location.hostname)}function E(){if(y()){console.log(o,"Scanning skipped (disabled or host blocked)"),p();return}const e=Array.from(document.images),t=e.filter(n=>q(n));t.length>0&&console.log(o,`Found ${t.length} new images to track (total on page: ${e.length})`);for(const n of t)$(n)}function q(e){if(s.has(e)||s.size>=200||!e.src||e.src.startsWith("data:"))return!1;const t=e.getBoundingClientRect();return!(t.width<50||t.height<50||t.width===0||t.height===0)}function $(e){const t=document.createElement("div");t.className="imagion-badge imagion-badge--pending",t.setAttribute("role","status"),t.setAttribute("lang",w),t.innerHTML='<span class="imagion-badge__logo">I</span><span class="imagion-badge__label">...</span>',l(t,"Analyzing"),t.dataset.requestState="pending";const n=`imagion-${++R}`;t.dataset.requestId=n;const a=document.createElement("span");a.className="imagion-wrapper";const r=window.getComputedStyle(e).zIndex;r&&r!=="auto"&&(a.style.zIndex=r);const _=e.parentNode;_&&(_.insertBefore(a,e),a.appendChild(e),a.appendChild(t)),s.set(e,{badge:t,wrapper:a}),N(e,t,n)}function N(e,t,n){const a=e.currentSrc||e.src;if(!a||a.startsWith("data:")){console.log(o,`Skipping data URI for ${n}`),u(t,{status:"error",message:"Unable to analyze data URI.",badgeId:n});return}console.log(o,`Requesting detection for ${n}:`,a.substring(0,100));const C={type:"REQUEST_DETECTION",imageUrl:a,badgeId:n,pageUrl:window.location.href};H(C).then(r=>{console.log(o,`Response for ${n}:`,r.status,r.verdict||r.message),u(t,r)}).catch(r=>{console.error(o,`Error for ${n}:`,r),u(t,{status:"error",message:r?.message||"Detection request failed.",badgeId:n})})}function H(e){return new Promise(t=>{chrome.runtime.sendMessage(e,n=>{if(chrome.runtime.lastError){console.error(o,"Runtime error:",chrome.runtime.lastError.message),t({status:"error",message:chrome.runtime.lastError.message,badgeId:e.badgeId});return}t(n)})})}function u(e,t){if(!e||!t||e.dataset.requestId!==t.badgeId)return;const n=e.querySelector(".imagion-badge__label");if(n)if(e.classList.remove("imagion-badge--pending","imagion-badge--ai","imagion-badge--real","imagion-badge--error","imagion-badge--missing-key"),t.status==="success"&&t.verdict){const a=t.verdict.toLowerCase();a==="ai"||a==="fake"||a==="ai_generated"||a==="likely_ai"?(e.classList.add("imagion-badge--ai"),n.textContent=i.aiLabel,l(e,i.aiLabel)):(e.classList.add("imagion-badge--real"),n.textContent=i.realLabel,l(e,i.realLabel)),e.title=T(t),e.dataset.requestState="success"}else if(t.status==="missing-key")e.classList.add("imagion-badge--missing-key"),n.textContent=i.loginLabel,l(e,i.loginLabel),e.title=t.message||"Click the Imagion icon to sign in.",e.dataset.requestState="key-required";else if(t.status==="rate-limit"){const a=t.badgeLabel??i.rateLimitLabel;e.classList.add("imagion-badge--error"),n.textContent=a,l(e,a),e.title=t.message||i.disabledHostMessage,e.dataset.requestState="rate-limit"}else e.classList.add("imagion-badge--error"),n.textContent=i.errorLabel,l(e,i.errorLabel),e.title=t.message||"Detection failed.",e.dataset.requestState="error"}function l(e,t){e.setAttribute("aria-label",`${i.badgePrefix}: ${t}`)}function T(e){const t=[];return e.verdict&&t.push(`Verdict: ${e.verdict}`),e.score!=null&&t.push(`Score: ${(Number(e.score)*100).toFixed(0)}%`),e.confidence!=null&&t.push(`Confidence: ${(Number(e.confidence)*100).toFixed(0)}%`),e.presentation&&t.push(e.presentation),t.length?t.join(`
`):i.tooltipFallback}function p(){const e=s.size;for(const[t,n]of s)I(t,n);s.clear(),e>0&&console.log(o,`Removed ${e} badges`)}function F(e){const n=(Array.isArray(e.imagionDisabledHosts)?e.imagionDisabledHosts:[]).map(a=>x(a)).filter(a=>!!a);f=new Set(n),n.length>0&&console.log(o,"Disabled hosts:",n)}function x(e){const t=e.trim();if(!t)return null;try{return(t.includes("://")?new URL(t):new URL(`https://${t}`)).hostname.toLowerCase()}catch{return t.toLowerCase()}}function k(e){const t=x(e);if(!t)return!1;const n=t.startsWith("www.")?t.slice(4):t;return f.has(t)||f.has(n)}let f=new Set;function v(){chrome.storage.local.get({imagionBadgeEnabled:!0,imagionDisabledHosts:[]},e=>{const t=e.imagionBadgeEnabled!==!1;if(m.enabled=t,F(e),console.log(o,"Settings synced:",{enabled:t,hostBlocked:k(window.location.hostname)}),y()){p();return}m.enabled?L():p()})}function A(){if(console.log(o,"Initializing on",window.location.hostname),S(window.location.hostname)){console.log(o,"Skipping on excluded domain:",window.location.hostname);return}D(),v(),setTimeout(()=>{E(),g()},500);const e=document.documentElement||document.body;e&&(new MutationObserver(()=>L()).observe(e,{childList:!0,subtree:!0}),console.log(o,"MutationObserver attached")),window.addEventListener("scroll",g,{passive:!0}),window.addEventListener("resize",g),chrome.storage.onChanged.addListener(v),console.log(o,"Initialization complete")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",A):A()})();
//# sourceMappingURL=content.js.map
