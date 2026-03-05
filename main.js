import gsap from "https://esm.sh/gsap@3.12.2";

const landingEl = document.getElementById("landing");
const landingMarkEl = document.getElementById("landingMark");
const landingPlusEls = Array.from(document.querySelectorAll(".landing-plus"));

const brandLogoEl = document.getElementById("brandLogo");
const logoMountEl = document.getElementById("logoMount");
const logoPrintFxEl = document.getElementById("logoPrintFx");

const heroPlusMap = {
  tl: document.querySelector(".hero-frame .fp-tl"),
  tr: document.querySelector(".hero-frame .fp-tr"),
  bl: document.querySelector(".hero-frame .fp-bl"),
  br: document.querySelector(".hero-frame .fp-br"),
};

let introPlayed = false;

let prevOverflowHtml = "";
let prevOverflowBody = "";
let prevPadRight = "";

function lockScroll(lock) {
  const sbw = window.innerWidth - document.documentElement.clientWidth;

  if (lock) {
    prevOverflowHtml = document.documentElement.style.overflow;
    prevOverflowBody = document.body.style.overflow;
    prevPadRight = document.documentElement.style.paddingRight;

    document.documentElement.style.paddingRight = `${sbw}px`;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return;
  }

  document.documentElement.style.overflow = prevOverflowHtml || "";
  document.body.style.overflow = prevOverflowBody || "";
  document.documentElement.style.paddingRight = prevPadRight || "";
  window.scrollTo(0, 0);
}

function syncLogoUrl() {
  if (!brandLogoEl) return;
  const src = brandLogoEl.currentSrc || brandLogoEl.src;

  if (logoPrintFxEl) logoPrintFxEl.style.setProperty("--logo-url", `url("${src}")`);
  if (logoMountEl) logoMountEl.style.setProperty("--logo-url", `url("${src}")`);
}

function syncMountSize() {
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
}

function syncPrintFxSize() {
  if (!logoPrintFxEl || !brandLogoEl) return;
  const r = brandLogoEl.getBoundingClientRect();
  logoPrintFxEl.style.width = `${Math.max(1, r.width)}px`;
  logoPrintFxEl.style.height = `${Math.max(1, r.height)}px`;
}

function resetStates() {
  gsap.set(landingEl, { autoAlpha: 1, "--landingA": 1 });
  gsap.set(landingPlusEls, { opacity: 0, x: 0, y: 0, clearProps: "transform" });

  gsap.set(".hero-frame .frame-plus", { opacity: 0 });
  gsap.set(logoMountEl, { opacity: 0 });

  gsap.set(brandLogoEl, { opacity: 0, x: 0, y: 0, scale: 1, clearProps: "transform" });
  gsap.set(logoPrintFxEl, {
    opacity: 0,
    "--py": 0,
    "--hx": 0,
    x: 0,
    y: 0,
    scale: 1,
    clearProps: "transform",
  });
}

function playIntro() {
  if (introPlayed) return;
  introPlayed = true;

  lockScroll(true);
  resetStates();

  if (logoPrintFxEl && !document.body.contains(logoPrintFxEl)) {
    document.body.appendChild(logoPrintFxEl);
  }
  logoPrintFxEl.classList.add("logo-float");

  syncLogoUrl();
  syncMountSize();
  syncPrintFxSize();

  const landingRect = landingMarkEl.getBoundingClientRect();
  const mountRect = logoMountEl.getBoundingClientRect();
  const baseRect = brandLogoEl.getBoundingClientRect();

  const startScale = landingRect.width / Math.max(1, baseRect.width);

  const startW = baseRect.width * startScale;
  const startH = baseRect.height * startScale;
  const startX = landingRect.left + (landingRect.width - startW) / 2;
  const startY = landingRect.top + (landingRect.height - startH) / 2;

  const endX = mountRect.left;
  const endY = mountRect.top;

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

  const MOVE_START = PRINT_DUR;
  const XFADE = MOVE_START + Math.max(0, MOVE_DUR - 0.12);

  const printState = { t: 0 };

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(logoPrintFxEl, { opacity: 0 });
      gsap.set(logoMountEl, { opacity: 1 });
      lockScroll(false);
    },
  });

  // PRINT scan
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

        logoPrintFxEl.style.setProperty("--py", ((layerIdx + 1) / LAYERS).toFixed(4));
        logoPrintFxEl.style.setProperty("--hx", frac.toFixed(4));
      },
    },
    0
  );

  // MOVE logo to topbar
  tl.to(
    logoPrintFxEl,
    { x: endX, y: endY, scale: 1, duration: MOVE_DUR, ease: "power2.inOut" },
    MOVE_START
  );

  // MOVE pluses
  landingPlusEls.forEach((p) => {
    const corner = p.getAttribute("data-corner");
    const target = heroPlusMap[corner];
    if (!target) return;

    const a = p.getBoundingClientRect();
    const b = target.getBoundingClientRect();

    tl.to(
      p,
      { x: b.left - a.left, y: b.top - a.top, duration: MOVE_DUR, ease: "power2.inOut" },
      MOVE_START
    );
  });

  // ✅ ONLY fade the orange background while the move happens
  tl.to(
    landingEl,
    { "--landingA": 0, duration: MOVE_DUR * 0.9, ease: "power1.out" },
    MOVE_START + 0.05
  );

  // crossfade plus sets near the end of the move
  tl.to(landingPlusEls, { opacity: 0, duration: 0.18, ease: "none" }, XFADE);
  tl.to(".hero-frame .frame-plus", { opacity: 1, duration: 0.18, ease: "none" }, XFADE);

  // hide overlay after background is basically gone
  tl.to(landingEl, { autoAlpha: 0, duration: 0.12, ease: "none" }, XFADE + 0.18);
}

async function boot() {
  try {
    await brandLogoEl?.decode();
  } catch {}

  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  syncLogoUrl();
  syncMountSize();
  syncPrintFxSize();

  requestAnimationFrame(() => requestAnimationFrame(playIntro));
}

window.addEventListener("resize", () => {
  syncLogoUrl();
  syncMountSize();
  syncPrintFxSize();
});

boot();