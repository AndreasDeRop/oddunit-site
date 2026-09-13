(() => {
  const CONSENT_KEY = "oddunit.cookieConsent.v1";
  const CONSENT_TTL_DAYS = 180;
  const GA_ID = "G-9CL0FN1S6R";
  const GTM_ID = "GTM-T7SBXJHJ";

  let analyticsLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  });

  function readConsent() {
    try {
      const raw = window.localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw);
      const decidedAt = Number(value.decidedAt || 0);
      const ttl = CONSENT_TTL_DAYS * 24 * 60 * 60 * 1000;

      if (!decidedAt || Date.now() - decidedAt > ttl) {
        window.localStorage.removeItem(CONSENT_KEY);
        return null;
      }

      return value;
    } catch {
      return null;
    }
  }

  function saveConsent(analytics) {
    try {
      window.localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({
          analytics: Boolean(analytics),
          decidedAt: Date.now(),
        }),
      );
    } catch {}
  }

  function loadScript(id, src) {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });

    loadScript("oddunit-ga", `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, {
      anonymize_ip: true,
      allow_ad_personalization_signals: false,
    });

    window.dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js",
    });
    loadScript("oddunit-gtm", `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);
  }

  function denyAnalytics() {
    window.gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }

  function injectStyles() {
    if (document.getElementById("oddunit-cookie-style")) return;

    const style = document.createElement("style");
    style.id = "oddunit-cookie-style";
    style.textContent = `
      .cookie-banner,
      .cookie-dock {
        --cookie-bg: #070707;
        --cookie-orange: #ff6b00;
        --cookie-purple: #8a2be2;
        --cookie-text: #f2f2f2;
        font-family: var(--font-jet, ui-monospace, SFMono-Regular, Menlo, monospace);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--cookie-text);
      }
      .cookie-banner {
        position: fixed;
        left: max(14px, var(--x0, 14px));
        right: max(14px, calc(100vw - var(--x1, calc(100vw - 14px))));
        bottom: max(14px, env(safe-area-inset-bottom));
        z-index: 2147483000;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: end;
        padding: 18px;
        border: 2px solid var(--cookie-orange);
        background: var(--cookie-bg);
        box-shadow: 0 18px 60px rgb(0 0 0 / 0.52);
      }
      .cookie-banner[hidden],
      .cookie-dock[hidden] {
        display: none !important;
      }
      .cookie-banner__label {
        display: block;
        margin: 0 0 8px;
        color: var(--cookie-orange);
        font-family: var(--font-display, Impact, sans-serif);
        font-size: clamp(18px, 2.1vw, 34px);
        line-height: 0.88;
      }
      .cookie-banner__text {
        max-width: 74ch;
        margin: 0;
        font-size: 11px;
        line-height: 1.45;
        letter-spacing: 0.04em;
        text-transform: none;
      }
      .cookie-banner__links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
        font-size: 10px;
      }
      .cookie-banner__links a,
      .cookie-dock a,
      .cookie-dock button {
        color: var(--cookie-orange);
        text-decoration: underline;
        text-underline-offset: 0.24em;
      }
      .cookie-banner__actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
      }
      .cookie-button {
        min-height: 42px;
        padding: 0 18px;
        border: 2px solid var(--cookie-orange);
        border-radius: 999px;
        background: transparent;
        color: var(--cookie-orange);
        cursor: pointer;
        font: inherit;
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .cookie-button--accept {
        border-color: var(--cookie-purple);
        background: var(--cookie-purple);
        color: var(--cookie-bg);
      }
      .cookie-button:focus-visible,
      .cookie-dock a:focus-visible,
      .cookie-dock button:focus-visible {
        outline: 2px solid var(--cookie-purple);
        outline-offset: 3px;
      }
      .cookie-dock {
        position: fixed;
        left: max(12px, var(--x0, 12px));
        bottom: max(10px, env(safe-area-inset-bottom));
        z-index: 2147482500;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border: 1px solid rgb(255 107 0 / 0.48);
        background: rgb(7 7 7 / 0.82);
        font-size: 9px;
        line-height: 1;
      }
      .cookie-dock button {
        border: 0;
        background: transparent;
        cursor: pointer;
        font: inherit;
        letter-spacing: inherit;
        text-transform: inherit;
      }
      @media (max-width: 700px) {
        .cookie-banner {
          left: 12px;
          right: 12px;
          bottom: 12px;
          grid-template-columns: 1fr;
          padding: 14px;
        }
        .cookie-banner__actions {
          justify-content: stretch;
        }
        .cookie-button {
          flex: 1 1 140px;
        }
        .cookie-dock {
          left: 10px;
          right: auto;
          max-width: calc(100vw - 20px);
          overflow: hidden;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function removeBanner() {
    document.querySelector(".cookie-banner")?.remove();
  }

  function createDock() {
    if (document.querySelector(".cookie-dock")) return;
    const dock = document.createElement("div");
    dock.className = "cookie-dock";
    dock.innerHTML = `
      <a href="/privacy/">PRIVACY</a>
      <span aria-hidden="true">/</span>
      <a href="/cookies/">COOKIES</a>
      <span aria-hidden="true">/</span>
      <button type="button" data-cookie-settings>INSTELLINGEN</button>
    `;
    document.body.appendChild(dock);
  }

  function createBanner() {
    removeBanner();
    const banner = document.createElement("section");
    banner.className = "cookie-banner";
    banner.setAttribute("aria-label", "Cookiekeuze");
    banner.innerHTML = `
      <div>
        <strong class="cookie-banner__label">Cookies?</strong>
        <p class="cookie-banner__text">
          We gebruiken noodzakelijke opslag voor de site en je keuze. Google Analytics en Tag Manager laden pas als je analytics accepteert.
        </p>
        <div class="cookie-banner__links">
          <a href="/cookies/">Cookiebeleid</a>
          <a href="/privacy/">Privacybeleid</a>
        </div>
      </div>
      <div class="cookie-banner__actions">
        <button class="cookie-button" type="button" data-cookie-reject>
          Weiger analytics
        </button>
        <button class="cookie-button cookie-button--accept" type="button" data-cookie-accept>
          Accepteer analytics
        </button>
      </div>
    `;
    document.body.appendChild(banner);
  }

  function applyConsent(consent) {
    if (consent?.analytics) {
      loadAnalytics();
      return;
    }
    denyAnalytics();
  }

  function bindActions() {
    document.addEventListener("click", (event) => {
      const accept = event.target.closest("[data-cookie-accept]");
      const reject = event.target.closest("[data-cookie-reject]");
      const settings = event.target.closest("[data-cookie-settings]");

      if (accept) {
        saveConsent(true);
        removeBanner();
        loadAnalytics();
      }

      if (reject) {
        saveConsent(false);
        removeBanner();
        denyAnalytics();
      }

      if (settings) {
        createBanner();
      }
    });
  }

  function init() {
    injectStyles();
    bindActions();
    createDock();

    const consent = readConsent();
    if (!consent) {
      createBanner();
      return;
    }

    applyConsent(consent);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
