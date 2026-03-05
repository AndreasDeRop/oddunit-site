import gsap from "https://esm.sh/gsap@3.12.2";

const brandLogoEl = document.getElementById("brandLogo");
const logoMountEl = document.getElementById("logoMount");
const logoPrintFxEl = document.getElementById("logoPrintFx");

const landingEl = document.getElementById("landing");
const landingMarkEl = document.getElementById("landingMark");
const landingPlusEls = Array.from(document.querySelectorAll(".landing-plus"));

const heroEl = document.getElementById("hero");

const heroStageEl = document.getElementById("heroStage");
const heroCanvasEl = document.getElementById("heroCanvas");

let bootReady = false;
let introPlayed = false;

let prevOverflowHtml = "";
let prevOverflowBody = "";

/* ✅ SCALE FIXED 1920x1080 CANVAS TO AVAILABLE HERO STAGE */
function fitHeroCanvas() {
  if (!heroStageEl || !heroCanvasEl) return;

  const r = heroStageEl.getBoundingClientRect();
  const artW = 1920;
  const artH = 1080;

  const scale = Math.min(r.width / artW, r.height / artH);

  document.documentElement.style.setProperty("--canvasScale", String(scale));
}

function lockScroll(lock) {
  const sbw = window.innerWidth - document.documentElement.clientWidth;

  if (lock) {
    prevOverflowHtml = document.documentElement.style.overflow;
    prevOverflowBody = document.body.style.overflow;

    document.documentElement.style.paddingRight = `${sbw}px`;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return;
  }

  document.documentElement.style.overflow = prevOverflowHtml || "";
  document.body.style.overflow = prevOverflowBody || "";
  document.documentElement.style.paddingRight = "";
}

function syncLogoPrintFx() {
  if (!logoPrintFxEl || !brandLogoEl) return;

  const r = brandLogoEl.getBoundingClientRect();
  logoPrintFxEl.style.width = `${Math.max(1, r.width)}px`;
  logoPrintFxEl.style.height = `${Math.max(1, r.height)}px`;

  const src = brandLogoEl.currentSrc || brandLogoEl.src;
  logoPrintFxEl.style.setProperty("--logo-url", `url("${src}")`);
}

function syncLogoRatioAndMountWidth() {
  if (!brandLogoEl || !logoMountEl) return;

  gsap.set(brandLogoEl, { x: 0, y: 0, scale: 1, clearProps: "transform" });

  const r = brandLogoEl.getBoundingClientRect();
  logoMountEl.style.width = `${Math.max(1, r.width)}px`;
  logoMountEl.style.height = `${Math.max(1, r.height)}px`;

  if (brandLogoEl.naturalWidth > 0 && brandLogoEl.naturalHeight > 0) {
    document.documentElement.style.setProperty(
      "--logo-ratio",
      `${brandLogoEl.naturalWidth} / ${brandLogoEl.naturalHeight}`
    );
  }

  syncLogoPrintFx();
}

function resetLandingStates() {
  document.body.classList.remove("intro-done");

  gsap.set(landingEl, { autoAlpha: 1 });
  landingEl?.setAttribute("aria-hidden", "false");

  gsap.set(heroEl, { autoAlpha: 0 });
  heroEl?.setAttribute("aria-hidden", "true");

  gsap.set(logoPrintFxEl, { opacity: 0, "--py": 0, "--hx": 0, clearProps: "transform" });
  gsap.set(landingPlusEls, { opacity: 0, clearProps: "transform" });
  gsap.set(brandLogoEl, { opacity: 0 });

  fitHeroCanvas();
}

function dockLogoInvisible() {
  if (!brandLogoEl || !logoMountEl) return;
  logoMountEl.appendChild(brandLogoEl);
  brandLogoEl.classList.remove("logo-float");
  gsap.set(brandLogoEl, { clearProps: "transform", opacity: 0 });
}

function playIntro() {
  if (introPlayed || !bootReady) return;
  introPlayed = true;

  lockScroll(true);
  resetLandingStates();
  syncLogoRatioAndMountWidth();

  if (brandLogoEl && !brandLogoEl.classList.contains("logo-float")) {
    document.body.appendChild(brandLogoEl);
    brandLogoEl.classList.add("logo-float");
  }

  if (logoPrintFxEl && !document.body.contains(logoPrintFxEl)) {
    document.body.appendChild(logoPrintFxEl);
  }
  logoPrintFxEl.classList.add("logo-float");

  const mountRect = logoMountEl.getBoundingClientRect();
  const landingRect = landingMarkEl.getBoundingClientRect();

  gsap.set(brandLogoEl, { x: 0, y: 0, scale: 1, clearProps: "transform" });
  const baseRect = brandLogoEl.getBoundingClientRect();

  const endX = mountRect.left;
  const endY = mountRect.top;

  const startScale = landingRect.width / Math.max(1, baseRect.width);
  const startX = landingRect.left;
  const startY = landingRect.top;

  gsap.set(brandLogoEl, { opacity: 0 });
  gsap.set(landingPlusEls, { opacity: 0.95 });

  gsap.set(logoPrintFxEl, {
    opacity: 1,
    x: startX,
    y: startY,
    scale: startScale,
    transformOrigin: "top left",
    "--py": 0,
    "--hx": 0,
  });

  const LAYERS = 4;
  const TIME_PER_LAYER = 0.6;
  const PRINT_DUR = LAYERS * TIME_PER_LAYER;
  const MOVE_DUR = 1.4;

  logoPrintFxEl.style.setProperty("--layerH", `${100 / LAYERS}%`);

  const printState = { t: 0 };

  const tl = gsap.timeline({
    onComplete: () => {
      document.body.classList.add("intro-done");

      gsap.set(landingEl, { autoAlpha: 0 });
      landingEl?.setAttribute("aria-hidden", "true");

      gsap.set(logoPrintFxEl, { opacity: 0 });
      dockLogoInvisible();

      gsap.set(heroEl, { autoAlpha: 1 });
      heroEl?.setAttribute("aria-hidden", "false");

      fitHeroCanvas(); /* ✅ ensure perfect fit when hero appears */
      lockScroll(false);
    },
  });

  tl.to(
    printState,
    {
      t: LAYERS,
      duration: PRINT_DUR,
      ease: "none",
      onUpdate: () => {
        const t = printState.t;
        const layerIdx = Math.floor(t);
        const frac = t - layerIdx;

        if (layerIdx >= LAYERS) {
          logoPrintFxEl.style.setProperty("--py", "1");
          logoPrintFxEl.style.setProperty("--hx", "1");
          return;
        }

        const py = (layerIdx + 1) / LAYERS;
        const hx = frac;

        logoPrintFxEl.style.setProperty("--py", py.toFixed(4));
        logoPrintFxEl.style.setProperty("--hx", hx.toFixed(4));
      },
    },
    0
  );

  tl.to(
    logoPrintFxEl,
    { x: endX, y: endY, scale: 1, duration: MOVE_DUR, ease: "power2.inOut" },
    PRINT_DUR
  );

  tl.to(landingPlusEls, { opacity: 0, duration: 0.2, ease: "none" }, PRINT_DUR + MOVE_DUR - 0.2);
}

function handleResize() {
  syncLogoRatioAndMountWidth();
  syncLogoPrintFx();
  fitHeroCanvas(); /* ✅ always keep layout identical */
}

window.addEventListener("resize", handleResize);

(async function boot() {
  resetLandingStates();

  try {
    await brandLogoEl.decode();
  } catch {}

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  bootReady = true;
  handleResize();

  requestAnimationFrame(() => requestAnimationFrame(playIntro));
})();