(function(){"use strict";const h="imagion-badge-style",s=new Map;let C=0,d=!1,c=!1;const u={enabled:!0},L={en:{aiLabel:"AI",realLabel:"Real",errorLabel:"Error",loginLabel:"Log in",badgePrefix:"Imagion badge",tooltipFallback:"Imagion verdict",rateLimitLabel:"Rate limited",disabledHostMessage:"Badges paused on this host."},es:{aiLabel:"IA",realLabel:"Real",errorLabel:"Error",loginLabel:"Iniciar sesión",badgePrefix:"Insignia Imagion",tooltipFallback:"Veredicto de Imagion",rateLimitLabel:"Límite de velocidad",disabledHostMessage:"Insignias pausadas en este host."}},p=navigator.language.split("-")[0],n=L[p]??L.en,E=`
.imagion-badge {
  position: absolute;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
  background: rgba(44, 120, 255, 0.85);
  color: #fff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.35);
  z-index: 2147483647;
  letter-spacing: 0.02em;
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  text-transform: uppercase;
}
.imagion-badge__logo {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  color: #1c1c1c;
  font-size: 9px;
}
.imagion-badge__label {
  line-height: 1;
}
.imagion-badge--ai {
  background: rgba(124, 77, 255, 0.95);
}
.imagion-badge--real {
  background: rgba(0, 200, 138, 0.95);
}
.imagion-badge--error {
  background: rgba(255, 69, 96, 0.95);
}
.imagion-badge--missing-key {
  background: rgba(255, 195, 0, 0.95);
  color: #2b2b2b;
}
`;function v(){if(document.getElementById(h))return;const e=document.createElement("style");e.id=h,e.textContent=E,document.head.appendChild(e)}function l(){d||(d=!0,requestAnimationFrame(()=>{d=!1,k()}))}function y(){c||(c=!0,requestAnimationFrame(()=>{c=!1,w()}))}function k(){for(const[e,t]of s){if(!e.isConnected){t.badge.remove(),s.delete(e);continue}B(e,t.badge)}}function x(){return!u.enabled||T(window.location.hostname)}function w(){if(x()){m();return}const e=Array.from(document.images);for(const t of e)_(t)&&q(t)}function _(e){return!(s.has(e)||s.size>=200||!e.src)}function q(e){const t=document.createElement("div");t.className="imagion-badge",t.setAttribute("role","status"),t.setAttribute("lang",p),t.innerHTML=`<span class="imagion-badge__logo">I</span><span class="imagion-badge__label">${n.badgePrefix}</span>`,o(t,n.badgePrefix),t.dataset.requestState="pending";const a=`imagion-${++C}`;t.dataset.requestId=a,document.body.appendChild(t),s.set(e,{badge:t}),l(),R(e,t,a)}function B(e,t){const a=e.getBoundingClientRect();if(a.width===0||a.height===0){t.style.display="none";return}t.style.display="inline-flex";const i=6,b=window.scrollX+a.left+a.width-t.offsetWidth-i,r=window.scrollY+a.top+i;t.style.transform=`translate(${b}px, ${r}px)`}function R(e,t,a){const i=e.currentSrc||e.src;if(!i||i.startsWith("data:")){g(t,{status:"error",message:"Unable to analyze data URI.",badgeId:a});return}const b={type:"REQUEST_DETECTION",imageUrl:i,badgeId:a,pageUrl:window.location.href};D(b).then(r=>{g(t,r)}).catch(r=>{g(t,{status:"error",message:r?.message||"Detection request failed.",badgeId:a})})}function D(e){return new Promise(t=>{chrome.runtime.sendMessage(e,a=>{if(chrome.runtime.lastError){t({status:"error",message:chrome.runtime.lastError.message,badgeId:e.badgeId});return}t(a)})})}function g(e,t){if(!e||!t||e.dataset.requestId!==t.badgeId)return;const a=e.querySelector(".imagion-badge__label");if(a)if(e.classList.remove("imagion-badge--ai","imagion-badge--real","imagion-badge--error","imagion-badge--missing-key"),t.status==="success"&&t.verdict){const i=t.verdict.toLowerCase();i==="ai"||i==="fake"?(e.classList.add("imagion-badge--ai"),a.textContent=n.aiLabel,o(e,n.aiLabel)):(e.classList.add("imagion-badge--real"),a.textContent=n.realLabel,o(e,n.realLabel)),e.title=H(t),e.dataset.requestState="success"}else t.status==="missing-key"?(e.classList.add("imagion-badge--missing-key"),a.textContent=n.loginLabel,o(e,n.loginLabel),e.title=t.message||"Add your API key via the Imagion extension options.",e.dataset.requestState="key-required"):t.status==="rate-limit"?(e.classList.add("imagion-badge--error"),a.textContent=n.rateLimitLabel,o(e,n.rateLimitLabel),e.title=t.message||n.disabledHostMessage,e.dataset.requestState="rate-limit"):(e.classList.add("imagion-badge--error"),a.textContent=n.errorLabel,o(e,n.errorLabel),e.title=t.message||"Detection failed.",e.dataset.requestState="error")}function o(e,t){e.setAttribute("aria-label",`${n.badgePrefix}: ${t}`)}function H(e){const t=[];return e.score!=null&&t.push(`Score ${Number(e.score).toFixed(2)}`),e.confidence!=null&&t.push(`Confidence ${Number(e.confidence).toFixed(2)}`),e.presentation&&t.push(e.presentation),e.retryAfterSeconds&&t.push(`Retry in ${e.retryAfterSeconds}s`),t.length?t.join(" | "):n.tooltipFallback}function m(){for(const[,e]of s)e.badge.remove();s.clear()}function M(e){const a=(Array.isArray(e.imagionDisabledHosts)?e.imagionDisabledHosts:[]).map(i=>S(i)).filter(i=>!!i);f=new Set(a)}function S(e){const t=e.trim();if(!t)return null;try{return(t.includes("://")?new URL(t):new URL(`https://${t}`)).hostname.toLowerCase()}catch{return t.toLowerCase()}}function T(e){const t=S(e);if(!t)return!1;const a=t.startsWith("www.")?t.slice(4):t;return f.has(t)||f.has(a)}let f=new Set;function I(){chrome.storage.local.get({imagionBadgeEnabled:!0,imagionDisabledHosts:[]},e=>{const t=e.imagionBadgeEnabled!==!1;if(u.enabled=t,M(e),x()){m();return}u.enabled?y():m()})}function A(){v(),I(),w(),l();const e=document.documentElement||document.body;e&&new MutationObserver(()=>y()).observe(e,{childList:!0,subtree:!0}),window.addEventListener("scroll",l,{passive:!0}),window.addEventListener("resize",l),chrome.storage.onChanged.addListener(I)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",A):A()})();
//# sourceMappingURL=content.js.map
