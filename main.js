import gsap from "https://esm.sh/gsap@3.12.2";
import ScrollToPlugin from "https://esm.sh/gsap@3.12.2/ScrollToPlugin";
import "./projects/projects.js";

gsap.registerPlugin(ScrollToPlugin);

const BREAKPOINT = 900;
const SNAP_DUR = 0.9;
const PLUS_Z = 20001;

const SECTION = {
  HERO: "hero",
  ABOUT: "about",
  PROJECTS: "projects",
};

const landingEl = document.getElementById("landing");
const landingMarkEl = document.getElementById("landingMark");
const landingPlusEls = Array.from(document.querySelectorAll(".landing-plus"));

const brandLogoEl = document.getElementById("brandLogo");
const logoMountEl = document.getElementById("logoMount");
const logoPrintFxEl = document.getElementById("logoPrintFx");

const heroFrameEl = document.querySelector(".hero-frame");
const aboutTitleEl = document.querySelector(".about-title");
const projectsFrameEl = document.querySelector(".projects-frame");

const plusEls = {
  tl: document.querySelector(".hero-frame .fp-tl"),
  tr: document.querySelector(".hero-frame .fp-tr"),
  bl: document.querySelector(".hero-frame .fp-bl"),
  br: document.querySelector(".hero-frame .fp-br"),
};

let introPlayed = false;
let snapState = SECTION.HERO;
let snapBusy = false;
let inputLockUntil = 0;
let wheelBound = false;

let prevOverflowHtml = "";
let prevOverflowBody = "";
let prevPadRight = "";

const mobileMq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);

function isMobile() {
  return mobileMq.matches;
}

function now() {
  return performance.now();
}

function getHeaderH() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--headerH");
  const val = parseFloat(raw);
  return Number.isFinite(val) ? val : 0;
}

function getHeaderOffset() {
  const styles = getComputedStyle(document.documentElement);
  return (
    parseFloat(styles.getPropertyValue("--headerH")) ||
    parseFloat(styles.getPropertyValue("--topbar-h")) ||
    0
  );
}

function scrollToY(y, duration = SNAP_DUR) {
  if (gsap.plugins && gsap.plugins.ScrollToPlugin) {
    return gsap.to(window, {
      scrollTo: { y, autoKill: true },
      duration,
      ease: "power2.inOut",
    });
  }

  const start = window.scrollY;
  const delta = y - start;
  const state = { t: 0 };

  return gsap.to(state, {
    t: 1,
    duration,
    ease: "power2.inOut",
    onUpdate: () => window.scrollTo(0, start + delta * state.t),
  });
}

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
      `${brandLogoEl.naturalWidth} / ${brandLogoEl.naturalHeight}`,
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
  gsap.set(Object.values(plusEls), {
    opacity: 0,
    x: 0,
    y: 0,
    clearProps: "transform",
  });

  gsap.set(logoMountEl, { opacity: 0 });
  gsap.set(brandLogoEl, {
    opacity: 0,
    x: 0,
    y: 0,
    scale: 1,
    clearProps: "transform",
  });

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

function getSectionElement(section) {
  if (section === SECTION.HERO) return document.getElementById("hero");
  if (section === SECTION.ABOUT) return document.getElementById("about");
  if (section === SECTION.PROJECTS) return document.getElementById("projects");
  return null;
}

function getSectionScrollY(section) {
  const el = getSectionElement(section);
  if (!el) return window.scrollY;

  if (isMobile()) {
    return Math.max(0, el.offsetTop - getHeaderOffset());
  }

  return el.offsetTop;
}

function getTargetFrameRect(section) {
  if (section === SECTION.HERO) return heroFrameEl?.getBoundingClientRect() || null;
  if (section === SECTION.ABOUT) return aboutTitleEl?.getBoundingClientRect() || null;
  if (section === SECTION.PROJECTS) return projectsFrameEl?.getBoundingClientRect() || null;
  return null;
}
function rectAfterScroll(rectNow, dy) {
  return {
    left: rectNow.left,
    right: rectNow.right,
    top: rectNow.top - dy,
    bottom: rectNow.bottom - dy,
  };
}
function getSectionCornerTargets(section, dy = 0) {
  const rectNow = getTargetFrameRect(section);
  if (!rectNow) return null;

  const rect = rectAfterScroll(rectNow, dy);
  const headerH = isMobile() ? getHeaderH() : 0;

  return {
    tl: { left: rect.left, top: Math.max(rect.top, headerH) },
    tr: { left: rect.right, top: Math.max(rect.top, headerH) },
    bl: { left: rect.left, top: rect.bottom },
    br: { left: rect.right, top: rect.bottom },
  };
}

function normalizeFixedPosition(el) {
  const r = el.getBoundingClientRect();

  document.body.appendChild(el);

  gsap.set(el, {
    position: "fixed",
    left: r.left,
    top: r.top,
    x: 0,
    y: 0,
    margin: 0,
    zIndex: PLUS_Z,
    opacity: 1,
  });

  el.style.right = "";
  el.style.bottom = "";
  el.style.visibility = "";

  return r;
}

function applyPlusesInstant(section) {
  const targets = getSectionCornerTargets(section);
  if (!targets) return;

  Object.entries(plusEls).forEach(([key, el]) => {
    if (!el || !targets[key]) return;

    document.body.appendChild(el);

    gsap.set(el, {
      position: "fixed",
      left: targets[key].left,
      top: targets[key].top,
      x: 0,
      y: 0,
      margin: 0,
      zIndex: PLUS_Z,
      opacity: 1,
    });

    el.style.right = "";
    el.style.bottom = "";
    el.style.visibility = "";
  });
}

function pinHeroPluses() {
  applyPlusesInstant(SECTION.HERO);
}

function animatePlusesToSection(tl, section, dy = 0, duration = SNAP_DUR, at = 0) {
  const targets = getSectionCornerTargets(section, dy);
  if (!targets) return;

  Object.entries(plusEls).forEach(([key, el]) => {
    if (!el || !targets[key]) return;

    const start = normalizeFixedPosition(el);
    const target = targets[key];

    tl.to(
      el,
      {
        x: target.left - start.left,
        y: target.top - start.top,
        duration,
        ease: "power2.inOut",
      },
      at,
    );
  });
}

function goToSection(section) {
  if (snapBusy || !introPlayed) return;
  if (!plusEls.tl || !plusEls.tr || !plusEls.bl || !plusEls.br) return;
  if (section === snapState) return;

  const startY = window.scrollY;
  const targetY = getSectionScrollY(section);
  const dy = targetY - startY;

  snapBusy = true;
  inputLockUntil = now() + 900;

  const tl = gsap.timeline({
    onComplete: () => {
      snapState = section;
      snapBusy = false;
      inputLockUntil = now() + 220;
      applyPlusesInstant(section);
    },
  });

  tl.add(scrollToY(targetY, SNAP_DUR), 0);
  animatePlusesToSection(tl, section, dy, SNAP_DUR, 0);
}

function shouldSnapBackFromProjects() {
  const projectsEl = getSectionElement(SECTION.PROJECTS);
  if (!projectsEl) return false;

  return window.scrollY <= projectsEl.offsetTop + 32;
}

function bindDesktopWheelSnap() {
  if (wheelBound) return;
  wheelBound = true;

  window.addEventListener(
    "wheel",
    (e) => {
      if (isMobile()) return;
      if (!introPlayed) return;

      const absY = Math.abs(e.deltaY);
      if (absY < 10) return;

      if (snapBusy || now() < inputLockUntil) {
        if (snapState !== SECTION.PROJECTS || shouldSnapBackFromProjects()) {
          e.preventDefault();
        }
        return;
      }

      if (snapState === SECTION.HERO) {
        if (e.deltaY > 0) {
          e.preventDefault();
          goToSection(SECTION.ABOUT);
        }
        return;
      }

      if (snapState === SECTION.ABOUT) {
        e.preventDefault();

        if (e.deltaY > 0) {
          goToSection(SECTION.PROJECTS);
        } else {
          goToSection(SECTION.HERO);
        }
        return;
      }

      if (snapState === SECTION.PROJECTS) {
        if (e.deltaY < 0 && shouldSnapBackFromProjects()) {
          e.preventDefault();
          goToSection(SECTION.ABOUT);
        }
      }
    },
    { passive: false },
  );
}

function bindScrollTriggers() {
  const triggers = document.querySelectorAll('a[href^="#"]');

  triggers.forEach((trigger) => {
    if (!trigger || trigger.dataset.bound === "1") return;
    trigger.dataset.bound = "1";

    trigger.addEventListener("click", (e) => {
      const href = trigger.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      if (snapBusy) return;

      if (isMobile()) {
        scrollToY(target.offsetTop - getHeaderOffset(), 0.9);
        return;
      }

      if (target.id === "hero") {
        goToSection(SECTION.HERO);
        return;
      }

      if (target.id === "about") {
        goToSection(SECTION.ABOUT);
        return;
      }

      if (target.id === "projects") {
        goToSection(SECTION.PROJECTS);
        return;
      }

      scrollToY(target.offsetTop, 0.9);
    });
  });
}

function refreshResponsiveLayout() {
  syncLogoUrl();
  syncMountSize();
  syncPrintFxSize();

  if (!introPlayed) return;

  if (isMobile()) {
    applyPlusesInstant(SECTION.HERO);
    return;
  }

  applyPlusesInstant(snapState);
}

function bindMobileModules() {
  document.querySelectorAll(".module").forEach((module) => {
    if (module.dataset.bound === "1") return;
    module.dataset.bound = "1";

    module.addEventListener("click", (e) => {
      if (!isMobile()) return;

      const clickedHead = e.target.closest(".module-head");
      const clickedStrip = e.target.closest(".module-strip");
      const clickedBody = e.target.closest(".module-body");
      const isOpen = module.classList.contains("is-open");

      if (isOpen) {
        if (!clickedHead && !clickedStrip) return;
        e.preventDefault();
        e.stopPropagation();
        module.classList.remove("is-open");
        return;
      }

      if (clickedBody) return;

      e.preventDefault();
      e.stopPropagation();

      document.querySelectorAll(".module.is-open").forEach((m) => {
        if (m !== module) m.classList.remove("is-open");
      });

      module.classList.add("is-open");
    });
  });
}

function bindMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuBackdrop = document.getElementById("mobileMenuBackdrop");
  const mobileMenuLinks = Array.from(document.querySelectorAll("#mobileMenu a"));

  if (!menuToggle || !mobileMenu || !mobileMenuBackdrop) return;

  const openMenu = () => {
    document.body.classList.add("menu-open");
    menuToggle.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    mobileMenu.setAttribute("aria-hidden", "false");
    mobileMenuBackdrop.setAttribute("aria-hidden", "false");
  };

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenuBackdrop.setAttribute("aria-hidden", "true");
  };

  const toggleMenu = () => {
    if (!isMobile()) return;

    if (document.body.classList.contains("menu-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  if (menuToggle.dataset.bound !== "1") {
    menuToggle.dataset.bound = "1";
    menuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
  }

  if (mobileMenuBackdrop.dataset.bound !== "1") {
    mobileMenuBackdrop.dataset.bound = "1";
    mobileMenuBackdrop.addEventListener("click", closeMenu);
  }

  mobileMenuLinks.forEach((link) => {
    if (link.dataset.bound === "1") return;
    link.dataset.bound = "1";
    link.addEventListener("click", closeMenu);
  });

  if (!document.documentElement.dataset.mobileMenuEscBound) {
    document.documentElement.dataset.mobileMenuEscBound = "1";
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        closeMenu();
      }
    });
  }

  if (!document.documentElement.dataset.mobileMenuMqBound) {
    document.documentElement.dataset.mobileMenuMqBound = "1";

    const handleMqChange = (e) => {
      if (!e.matches) closeMenu();
    };

    if (typeof mobileMq.addEventListener === "function") {
      mobileMq.addEventListener("change", handleMqChange);
    } else if (typeof mobileMq.addListener === "function") {
      mobileMq.addListener(handleMqChange);
    }
  }
}

function playIntro() {
  if (introPlayed) return;
  introPlayed = true;

  document.body.classList.add("is-intro");
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

  const heroTargets = getSectionCornerTargets(SECTION.HERO);

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

  const LAYERS = 25;
  const TIME_PER_LAYER = 0.07;
  const PRINT_DUR = LAYERS * TIME_PER_LAYER;
  const MOVE_DUR = 1.4;
  const MOVE_START = PRINT_DUR;
  const XFADE = MOVE_START + Math.max(0, MOVE_DUR - 0.12);

  logoPrintFxEl.style.setProperty("--layerH", `${100 / LAYERS}%`);

  const printState = { t: 0 };

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(logoPrintFxEl, { opacity: 0 });
      gsap.set(logoMountEl, { opacity: 1 });

      pinHeroPluses();
      snapState = SECTION.HERO;

      document.body.classList.remove("is-intro");
      lockScroll(false);
      bindDesktopWheelSnap();

      requestAnimationFrame(() => {
        refreshResponsiveLayout();
      });
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

        logoPrintFxEl.style.setProperty("--py", ((layerIdx + 1) / LAYERS).toFixed(4));
        logoPrintFxEl.style.setProperty("--hx", frac.toFixed(4));
      },
    },
    0,
  );

  tl.to(
    logoPrintFxEl,
    {
      x: endX,
      y: endY,
      scale: 1,
      duration: MOVE_DUR,
      ease: "power2.inOut",
    },
    MOVE_START,
  );

  landingPlusEls.forEach((el) => {
    const corner = el.getAttribute("data-corner");
    const target = heroTargets?.[corner];
    if (!target) return;

    const start = el.getBoundingClientRect();

    tl.to(
      el,
      {
        x: target.left - start.left,
        y: target.top - start.top,
        duration: MOVE_DUR,
        ease: "power2.inOut",
      },
      MOVE_START,
    );
  });

  tl.to(
    landingEl,
    { "--landingA": 0, duration: MOVE_DUR * 0.9, ease: "power1.out" },
    MOVE_START + 0.05,
  );

  tl.to(landingPlusEls, { opacity: 0, duration: 0.18, ease: "none" }, XFADE);
  tl.to(Object.values(plusEls), { opacity: 1, duration: 0.18, ease: "none" }, XFADE);
  tl.to(landingEl, { autoAlpha: 0, duration: 0.12, ease: "none" }, XFADE + 0.18);
}

let resizeTimer = 0;

function bindResizeHandling() {
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      refreshResponsiveLayout();
    }, 120);
  });

  window.addEventListener("orientationchange", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      refreshResponsiveLayout();
    }, 220);
  });
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

  bindMobileModules();
  bindMobileMenu();
  bindScrollTriggers();
  bindResizeHandling();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      playIntro();
    });
  });
}

boot();