import gsap from "https://esm.sh/gsap@3.12.2";
import ScrollToPlugin from "https://esm.sh/gsap@3.12.2/ScrollToPlugin";
import "./projects/projects.js";
gsap.registerPlugin(ScrollToPlugin);
// ✅ scroll helper (werkt met plugin OF zonder)
function scrollToY(y, duration = 0.9) {
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
const landingEl = document.getElementById("landing");
const landingMarkEl = document.getElementById("landingMark");
const landingPlusEls = Array.from(document.querySelectorAll(".landing-plus"));

const brandLogoEl = document.getElementById("brandLogo");
const logoMountEl = document.getElementById("logoMount");
const logoPrintFxEl = document.getElementById("logoPrintFx");
const PLUS_Z = 20001;
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

  // document.body.classList.add("is-intro");
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

  const LAYERS = 25;
  const TIME_PER_LAYER = 0.07;
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

  requestAnimationFrame(() => {
    pinnedHome = pinHomePluses();
    setupBidirectionalSnap(pinnedHome);
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
    0
  );

  tl.to(
    logoPrintFxEl,
    { x: endX, y: endY, scale: 1, duration: MOVE_DUR, ease: "power2.inOut" },
    MOVE_START
  );

  landingPlusEls.forEach((p) => {
    const corner = p.getAttribute("data-corner");
    const target = heroPlusMap[corner];
    if (!target) return;

    const a = p.getBoundingClientRect();
    const b = target.getBoundingClientRect();

    tl.to(
      p,
      {
        x: b.left - a.left,
        y: b.top - a.top,
        duration: MOVE_DUR,
        ease: "power2.inOut",
      },
      MOVE_START
    );
  });

  tl.to(
    landingEl,
    { "--landingA": 0, duration: MOVE_DUR * 0.9, ease: "power1.out" },
    MOVE_START + 0.05
  );

  tl.to(landingPlusEls, { opacity: 0, duration: 0.18, ease: "none" }, XFADE);
  tl.to(".hero-frame .frame-plus", { opacity: 1, duration: 0.18, ease: "none" }, XFADE);
  tl.to(landingEl, { autoAlpha: 0, duration: 0.12, ease: "none" }, XFADE + 0.18);
}

let pinnedHome = null;
let snapState = "hero"; // "hero" | "about"
let snapBusy = false;
let lastScrollY = 0;

function getS() {
  const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--s"));
  return Number.isFinite(s) && s > 0 ? s : 1;
}

function ensureFixedFromRect(el) {
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
  return r;
}

function undockFromAboutToFixed(pinned) {
  ["tl", "tr", "bl", "br"].forEach((k) => {
    const el = pinned?.[k];
    if (!el) return;

    // als hij in about zit: classes weg
    el.classList.remove("about-plus", `ap-${k}`);

    // zet hem fixed op z’n huidige viewport positie
    ensureFixedFromRect(el);
  });
}
function dockIntoFrame(pinned, frameEl) {
  if (!pinned || !frameEl) return;

  const r = frameEl.getBoundingClientRect();
  const headerH = mobileMq.matches ? getHeaderH() : 0;

  const targets = {
    tl: { left: r.left, top: Math.max(r.top, headerH) },
    tr: { left: r.right, top: Math.max(r.top, headerH) },
    bl: { left: r.left, top: r.bottom },
    br: { left: r.right, top: r.bottom },
  };

  ["tl", "tr", "bl", "br"].forEach((k) => {
    const el = pinned[k];
    if (!el) return;

    document.body.appendChild(el);

    el.classList.remove("about-plus", "ap-tl", "ap-tr", "ap-bl", "ap-br");

    gsap.set(el, {
      position: "fixed",
      left: targets[k].left,
      top: targets[k].top,
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
function dockIntoAbout(pinned) {
  const aboutTitle = document.querySelector(".about-title");
  if (!aboutTitle) return;

  const r = aboutTitle.getBoundingClientRect();
  const headerH = mobileMq.matches ? getHeaderH() : 0;

  const targets = {
    tl: { left: r.left, top: Math.max(r.top, headerH) },
    tr: { left: r.right, top: Math.max(r.top, headerH) },
    bl: { left: r.left, top: r.bottom },
    br: { left: r.right, top: r.bottom },
  };

  ["tl", "tr", "bl", "br"].forEach((k) => {
    const el = pinned?.[k];
    if (!el) return;

    document.body.appendChild(el);

    el.classList.remove("about-plus", "ap-tl", "ap-tr", "ap-bl", "ap-br");

    gsap.set(el, {
      position: "fixed",
      left: targets[k].left,
      top: targets[k].top,
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
function rectAfterScroll(rectNow, dy) {
  // scroll down: dy > 0 => rect.top wordt kleiner (minus dy)
  return {
    left: rectNow.left,
    right: rectNow.right,
    top: rectNow.top - dy,
    bottom: rectNow.bottom - dy,
  };
}

// hero corners: center op frame corners
function heroCornerDest(frameRectEnd, elRect, k) {
  const w = elRect.width;
  const h = elRect.height;

  const cx = k.includes("l") ? frameRectEnd.left : frameRectEnd.right;
  const cy = k.includes("t") ? frameRectEnd.top : frameRectEnd.bottom;

  return { left: cx - w / 2, top: cy - h / 2 };
}
function setFixedFromRect(el, rect) {
  document.body.appendChild(el);

  el.classList.remove("about-plus", "ap-tl", "ap-tr", "ap-bl", "ap-br");

  gsap.set(el, {
    position: "fixed",
    left: rect.left,
    top: rect.top,
    x: 0,
    y: 0,
    margin: 0,
    zIndex: PLUS_Z,
    opacity: 1,
  });

  el.style.right = "";
  el.style.bottom = "";
  el.style.visibility = "";

  return rect;
}

function measureAboutDockRectNow(el, k, aboutTitle, startRect) {
  // tijdelijk echt docken zodat we de ECHTE eindpositie meten
  aboutTitle.appendChild(el);

  el.classList.remove("about-plus", "ap-tl", "ap-tr", "ap-bl", "ap-br");
  el.classList.add("about-plus", `ap-${k}`);

  // fixed styles weg zodat CSS het echte dock kan bepalen
  el.style.position = "";
  el.style.left = "";
  el.style.top = "";
  el.style.right = "";
  el.style.bottom = "";
  el.style.margin = "";
  el.style.zIndex = "";
  el.style.visibility = "hidden";

  gsap.set(el, { x: 0, y: 0, opacity: 1 });

  const rect = el.getBoundingClientRect();

  // terug exact op startpositie zetten als fixed element
  setFixedFromRect(el, startRect);

  return rect;
}
function snapHeroToAbout(pinned, opts = {}) {
  if (snapBusy) return;

  const hero = document.getElementById("hero");
  const about = document.getElementById("about");
  const aboutTitle = document.querySelector(".about-title");
  if (!hero || !about || !aboutTitle || !pinned) return;

  snapBusy = true;

  const startY = window.scrollY;

  let endY;
  if (mobileMq.matches) {
    endY = about.offsetTop - getHeaderOffset();
  } else {
    endY = about.offsetTop;
  }

  const dy = endY - startY;
  const D = 0.9;

  const tl = gsap.timeline({
    onComplete: () => {
      snapBusy = false;
      snapState = "about";
      dockIntoAbout(pinned);
      lastScrollY = window.scrollY;
      opts.onComplete?.();
    },
  });

  tl.add(scrollToY(endY, D), 0);

  ["tl", "tr", "bl", "br"].forEach((k) => {
    const el = pinned[k];
    if (!el) return;

    const startRect = ensureFixedFromRect(el);
    const targetNow = measureAboutDockRectNow(el, k, aboutTitle, startRect);
    const targetEnd = rectAfterScroll(targetNow, dy);

    if (mobileMq.matches && (k === "tl" || k === "tr")) {
      targetEnd.top = Math.max(targetEnd.top, getHeaderH());
    }

    tl.to(
      el,
      {
        x: targetEnd.left - startRect.left,
        y: targetEnd.top - startRect.top,
        duration: D,
        ease: "power2.inOut",
        zIndex: PLUS_Z,
      },
      0
    );
  });
}
function snapAboutToHero(pinned) {
  if (snapBusy) return;

  const hero = document.getElementById("hero");
  const heroFrame = document.querySelector(".hero-frame");
  if (!hero || !heroFrame || !pinned) return;

  snapBusy = true;

  undockFromAboutToFixed(pinned);

  const startY = window.scrollY;
  const endY = hero.offsetTop;
  const dy = endY - startY;

  const frameNow = heroFrame.getBoundingClientRect();
  const frameEnd = rectAfterScroll(frameNow, dy);

  const D = 0.9;

  const tl = gsap.timeline({
    onComplete: () => {
      snapBusy = false;
      snapState = "hero";
      dockIntoFrame(pinned, heroFrame);
      lastScrollY = window.scrollY;
    },
  });

  tl.add(scrollToY(endY, D), 0);

  ["tl", "tr", "bl", "br"].forEach((k) => {
    const el = pinned[k];
    if (!el) return;

    const r = el.getBoundingClientRect();
    const dest = heroCornerDest(frameEnd, r, k);

    tl.to(
      el,
      {
        x: dest.left - r.left,
        y: dest.top - r.top,
        duration: D,
        ease: "power2.inOut",
      },
      0
    );
  });
}
function snapAboutToProjects(pinned) {
  if (snapBusy) return;

  const about = document.getElementById("about");
  const projects = document.getElementById("projects");
  const projectsFrame = document.querySelector(".projects-frame");
  if (!about || !projects || !projectsFrame || !pinned) return;

  snapBusy = true;

  undockFromAboutToFixed(pinned);

  const startY = window.scrollY;
  const endY = projects.offsetTop;
  const dy = endY - startY;

  const frameNow = projectsFrame.getBoundingClientRect();
  const frameEnd = rectAfterScroll(frameNow, dy);

  const D = 0.9;

  const tl = gsap.timeline({
    onComplete: () => {
      snapBusy = false;
      snapState = "projects";
      dockIntoFrame(pinned, projectsFrame);
      lastScrollY = window.scrollY;
    },
  });

  tl.add(scrollToY(endY, D), 0);

  ["tl", "tr", "bl", "br"].forEach((k) => {
    const el = pinned[k];
    if (!el) return;

    const r = ensureFixedFromRect(el);
    const dest = heroCornerDest(frameEnd, r, k);

    tl.to(
      el,
      {
        x: dest.left - r.left,
        y: dest.top - r.top,
        duration: D,
        ease: "power2.inOut",
        zIndex: PLUS_Z,
      },
      0
    );
  });
}
function snapProjectsToAbout(pinned) {
  if (snapBusy) return;

  const about = document.getElementById("about");
  const aboutTitle = document.querySelector(".about-title");
  const projects = document.getElementById("projects");
  if (!about || !aboutTitle || !projects || !pinned) return;

  snapBusy = true;

  const startY = window.scrollY;
  const endY = about.offsetTop;
  const dy = endY - startY;
  const D = 0.9;

  const tl = gsap.timeline({
    onComplete: () => {
      snapBusy = false;
      snapState = "about";
      dockIntoAbout(pinned);
      lastScrollY = window.scrollY;
    },
  });

  tl.add(scrollToY(endY, D), 0);

  ["tl", "tr", "bl", "br"].forEach((k) => {
    const el = pinned[k];
    if (!el) return;

    const startRect = ensureFixedFromRect(el);
    const targetNow = measureAboutDockRectNow(el, k, aboutTitle, startRect);
    const targetEnd = rectAfterScroll(targetNow, dy);

    tl.to(
      el,
      {
        x: targetEnd.left - startRect.left,
        y: targetEnd.top - startRect.top,
        duration: D,
        ease: "power2.inOut",
        zIndex: PLUS_Z,
      },
      0
    );
  });
}
function bindScrollTriggers(pinned) {
  const triggers = document.querySelectorAll(".hero-scroll, .about-scroll");

  triggers.forEach((trigger) => {
    if (!trigger || trigger.dataset.bound === "1") return;

    trigger.dataset.bound = "1";

    trigger.addEventListener("click", (e) => {
      const href = trigger.getAttribute("href");
      if (!href) return;

      if (!href.startsWith("#")) return;

      e.preventDefault();
      if (snapBusy) return;

      const target = document.querySelector(href);
      if (!target) return;

      // MOBILE: geen snap, alleen scroll
      if (mobileMq.matches) {
        const y = target.offsetTop - getHeaderOffset();
        scrollToY(y, 0.9);
        return;
      }

      if (target.id === "about") {
        if (snapState === "hero") {
          snapHeroToAbout(pinned);
          return;
        }

        if (snapState === "projects") {
          snapProjectsToAbout(pinned);
          return;
        }

        scrollToY(target.offsetTop, 0.9);
        return;
      }

      if (target.id === "projects") {
        if (snapState === "about") {
          snapAboutToProjects(pinned);
          return;
        }

        scrollToY(target.offsetTop, 0.9);
        return;
      }

      scrollToY(target.offsetTop, 0.9);
    });
  });
}
function setupBidirectionalSnap(pinned) {
  lastScrollY = window.scrollY;

  const hero = document.getElementById("hero");
  const about = document.getElementById("about");
  const projects = document.getElementById("projects");

  if (!hero || !about || !projects) return;

  bindScrollTriggers(pinned);

  // MOBILE:
  // plusjes blijven vanaf na de intro gewoon fixed op hun plek staan
  // geen snap tussen sections
  if (mobileMq.matches) {
    snapState = "hero";
    snapBusy = false;
    return;
  }

  const SNAP_UP_AT = 0.15;
  const SNAP_DOWN_TO_PROJECTS_AT = 0.02;
  const SNAP_PROJECTS_BACK_AT = 0.06;

  window.addEventListener(
    "scroll",
    () => {
      if (snapBusy) return;

      const y = window.scrollY;
      const dir = y > lastScrollY ? "down" : y < lastScrollY ? "up" : "none";
      lastScrollY = y;

      if (dir === "none") return;

      if (snapState === "hero" && dir === "down") {
        const heroH = hero.offsetHeight || window.innerHeight;

        if (window.scrollY > 2 && window.scrollY < heroH * 0.95) {
          snapHeroToAbout(pinned);
          return;
        }
      }

      if (snapState === "about" && dir === "up") {
        const aboutTopY = about.getBoundingClientRect().top + window.scrollY;
        const aboutH = about.offsetHeight || window.innerHeight;
        const q = (window.scrollY - aboutTopY) / aboutH;

        if (q <= SNAP_UP_AT) {
          snapAboutToHero(pinned);
          return;
        }
      }

      if (snapState === "about" && dir === "down") {
        const aboutTopY = about.getBoundingClientRect().top + window.scrollY;
        const aboutH = about.offsetHeight || window.innerHeight;
        const q = (window.scrollY - aboutTopY) / aboutH;

        if (q >= SNAP_DOWN_TO_PROJECTS_AT) {
          snapAboutToProjects(pinned);
          return;
        }
      }

      if (snapState === "projects" && dir === "up") {
        const projectsTopY = projects.getBoundingClientRect().top + window.scrollY;
        const projectsH = projects.offsetHeight || window.innerHeight;
        const q = (window.scrollY - projectsTopY) / projectsH;

        if (q <= SNAP_PROJECTS_BACK_AT) {
          snapProjectsToAbout(pinned);
        }
      }
    },
    { passive: true }
  );
}
function pinHomePluses() {
  const map = {
    tl: document.querySelector(".hero-frame .fp-tl"),
    tr: document.querySelector(".hero-frame .fp-tr"),
    bl: document.querySelector(".hero-frame .fp-bl"),
    br: document.querySelector(".hero-frame .fp-br"),
  };

  Object.values(map).forEach((el) => {
    if (!el) return;
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
  });

  return map;
}
const mobileMq = window.matchMedia("(max-width: 900px)");

function refreshResponsiveLayout() {
  syncLogoUrl();
  syncMountSize();
  syncPrintFxSize();

  if (!pinnedHome) return;

  if (snapState === "about") {
    dockIntoAbout(pinnedHome);
    return;
  }

  if (snapState === "projects") {
    const projectsFrame = document.querySelector(".projects-frame");
    if (projectsFrame) {
      dockIntoFrame(pinnedHome, projectsFrame);
    }
    return;
  }

  const heroFrame = document.querySelector(".hero-frame");
  if (!heroFrame) return;

  dockIntoFrame(pinnedHome, heroFrame);
}

window.addEventListener("resize", refreshResponsiveLayout);

function bindMobileModules() {
  document.querySelectorAll(".module").forEach((module) => {
    if (module.dataset.bound === "1") return;
    module.dataset.bound = "1";

    module.addEventListener("click", (e) => {
      if (!mobileMq.matches) return;

      const clickedHead = e.target.closest(".module-head");
      const clickedStrip = e.target.closest(".module-strip");
      const clickedBody = e.target.closest(".module-body");

      const isOpen = module.classList.contains("is-open");

      if (isOpen) {
        // open module mag enkel sluiten via kop of onderste balk
        if (!clickedHead && !clickedStrip) return;
        e.preventDefault();
        e.stopPropagation();
        module.classList.remove("is-open");
        return;
      }

      // gesloten module mag openen als je op kop, balk of leeg vlak van die module klikt
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
    if (!mobileMq.matches) return;

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
      if (!e.matches) {
        closeMenu();
      }
    };

    if (typeof mobileMq.addEventListener === "function") {
      mobileMq.addEventListener("change", handleMqChange);
    } else if (typeof mobileMq.addListener === "function") {
      mobileMq.addListener(handleMqChange);
    }
  }
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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      playIntro();
    });
  });
}

boot();