/**
 * Finance Calculators Template — Consent + Helpers
 *
 * Goal:
 * - EU-friendly consent UX (Necessary / Analytics / Ads)
 * - Store consent in localStorage
 * - Load optional scripts only after consent
 *
 * How to use:
 * - Add scripts with data-consent="analytics" or data-consent="ads"
 *   Example:
 *     <script data-consent="analytics" data-src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>
 *     <script data-consent="analytics">
 *       window.dataLayer = window.dataLayer || [];
 *       function gtag(){dataLayer.push(arguments);}
 *       gtag('js', new Date());
 *       gtag('config', 'G-XXXX', { anonymize_ip: true });
 *     </script>
 *
 * - For AdSense you can add:
 *     <script data-consent="ads" data-src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossorigin="anonymous"></script>
 */

(function(){
  const CONSENT_KEY = "fc_consent_v2";

  function formatEUR(n){
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
  }

  function byId(id){ return document.getElementById(id); }

  function getConsent(){
    try{
      return JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
    }catch(e){
      return null;
    }
  }

  function setConsent(consent){
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      ...consent,
      ts: new Date().toISOString(),
      v: 2
    }));
  }

  function applyConsent(consent){
    // Load scripts that are gated by consent.
    // Strategy:
    // - Scripts with data-src are external placeholders and will be injected when allowed.
    // - Inline scripts with data-consent will be executed when allowed by cloning into a real script tag.
    if(!consent) return;

    const allowed = (cat) => {
      if(cat === "necessary") return true;
      if(cat === "analytics") return !!consent.analytics;
      if(cat === "ads") return !!consent.ads;
      return false;
    };

    // External scripts placeholders:
    document.querySelectorAll("script[data-consent][data-src]").forEach(ph => {
      const cat = ph.getAttribute("data-consent");
      if(!allowed(cat)) return;

      // Prevent double-load
      if(ph.getAttribute("data-loaded") === "1") return;

      const s = document.createElement("script");
      s.src = ph.getAttribute("data-src");
      // Copy safe attributes
      if(ph.getAttribute("crossorigin")) s.setAttribute("crossorigin", ph.getAttribute("crossorigin"));
      if(ph.getAttribute("referrerpolicy")) s.setAttribute("referrerpolicy", ph.getAttribute("referrerpolicy"));
      s.async = true;

      ph.setAttribute("data-loaded", "1");
      ph.parentNode.insertBefore(s, ph.nextSibling);
    });

    // Inline gated scripts:
    document.querySelectorAll("script[data-consent]:not([data-src])").forEach(inline => {
      const cat = inline.getAttribute("data-consent");
      if(!allowed(cat)) return;

      if(inline.getAttribute("data-executed") === "1") return;

      const s = document.createElement("script");
      s.text = inline.textContent || "";
      inline.setAttribute("data-executed", "1");
      inline.parentNode.insertBefore(s, inline.nextSibling);
    });
  }

  function openModal(){
    const modal = document.querySelector(".consent-modal");
    if(modal) modal.style.display = "flex";
  }
  function closeModal(){
    const modal = document.querySelector(".consent-modal");
    if(modal) modal.style.display = "none";
  }

  function initConsentUI(){
    const modal = document.querySelector(".consent-modal");
    if(!modal) return;

    const chkAnalytics = modal.querySelector("#consentAnalytics");
    const chkAds = modal.querySelector("#consentAds");

    const btnAcceptAll = modal.querySelector("[data-action='accept-all']");
    const btnRejectAll = modal.querySelector("[data-action='reject-all']");
    const btnSave = modal.querySelector("[data-action='save']");

    const btnOpenSettings = document.querySelector("[data-action='open-consent']");

    // Open settings link (footer)
    btnOpenSettings?.addEventListener("click", (e) => {
      e.preventDefault();
      const current = getConsent();
      if(current){
        chkAnalytics.checked = !!current.analytics;
        chkAds.checked = !!current.ads;
      }
      openModal();
    });

    btnAcceptAll?.addEventListener("click", () => {
      const c = { necessary:true, analytics:true, ads:true };
      setConsent(c);
      closeModal();
      applyConsent(c);
    });

    btnRejectAll?.addEventListener("click", () => {
      const c = { necessary:true, analytics:false, ads:false };
      setConsent(c);
      closeModal();
      applyConsent(c);
    });

    btnSave?.addEventListener("click", () => {
      const c = { necessary:true, analytics: !!chkAnalytics.checked, ads: !!chkAds.checked };
      setConsent(c);
      closeModal();
      applyConsent(c);
    });

    // First visit: show modal
    const current = getConsent();
    if(!current){
      // defaults off (strict)
      chkAnalytics.checked = false;
      chkAds.checked = false;
      openModal();
    }else{
      // Apply stored consent
      chkAnalytics.checked = !!current.analytics;
      chkAds.checked = !!current.ads;
      applyConsent(current);
    }
  }

  window.FC = { formatEUR, byId, getConsent, setConsent };

  document.addEventListener("DOMContentLoaded", initConsentUI);
})();
