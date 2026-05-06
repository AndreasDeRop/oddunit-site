import gsap from "https://esm.sh/gsap@3.12.2";
import ScrollToPlugin from "https://esm.sh/gsap@3.12.2/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

const BREAKPOINT = 900;
const APP_ASSET_VERSION = "20260506-project-layout";
const SNAP_DUR = 0.9;
const PLUS_Z = 99999;
const MOBILE_SWIPE_MIN = 52;
const MOBILE_SWIPE_LOCK_MS = 260;

const SECTION = {
  HERO: "hero",
  ABOUT: "about",
  PROJECTS: "projects",
  SOCIALS: "socials",
  CONTACT: "contact",
  NEWSLETTER: "newsletter",
  FAQ: "faq",
};
const SECTION_ORDER = [
  SECTION.HERO,
  SECTION.ABOUT,
  SECTION.PROJECTS,
  SECTION.SOCIALS,
  SECTION.CONTACT,
  SECTION.NEWSLETTER,
  SECTION.FAQ,
];

const landingEl = document.getElementById("landing");
const landingMarkEl = document.getElementById("landingMark");
const landingPlusEls = Array.from(document.querySelectorAll(".landing-plus"));

const brandLogoEl = document.getElementById("brandLogo");
const introLogoEl = document.getElementById("introLogo");
const logoMountEl = document.getElementById("logoMount");
const logoPrintFxEl = document.getElementById("logoPrintFx");

const heroFrameEl = document.querySelector(".hero-frame");
const aboutTitleEl = document.querySelector(".about-title");
const aboutFrameEl = document.querySelector(".about-frame");
const projectsFrameEl = document.querySelector(".projects-frame");
const socialsTitleEl = document.querySelector(".socials-titlebox");
const socialsFrameEl = document.querySelector(".socials-frame");
const contactTitleEl = document.querySelector(".contact-titlebox");
const contactFrameEl = document.querySelector(".contact-frame");
const newsletterCardEl = document.querySelector(".newsletter-card");
const newsletterFrameEl = document.querySelector(".newsletter-frame");
const faqTitleEl = document.querySelector(".faq-titlebox");
const faqFrameEl = document.querySelector(".faq-frame");
const mobileMenuEl = document.getElementById("mobileMenu");
//coming soon
// const landingComingSoonEl = document.getElementById("landingComingSoon");
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
let mobileFrozenPlusTargets = null;
let mobileTouchStartY = 0;
let mobileTouchStartX = 0;
let mobileTouchActive = false;
let mobileTouchLockedAxis = "";
let desktopSectionSyncRaf = 0;
let desktopPlusSyncTween = null;
let projectsScenePromise = null;
const mobileMq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);

function loadProjectsScene() {
  if (!projectsScenePromise) {
    projectsScenePromise = import(`./projects/projects.js?v=${APP_ASSET_VERSION}`).catch((error) => {
      projectsScenePromise = null;
      throw error;
    });
  }

  return projectsScenePromise;
}

function setActiveSectionState(section) {
  document.documentElement.dataset.activeSection = section;
  document.body.dataset.activeSection = section;
}

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
  const brandSrc = brandLogoEl?.currentSrc || brandLogoEl?.src || "";
  const introSrc = introLogoEl?.currentSrc || introLogoEl?.src || brandSrc;

  setPrintLogoSource(introSrc);

  if (logoMountEl && brandSrc) {
    logoMountEl.style.setProperty("--logo-url", `url("${brandSrc}")`);
  }
}

function setPrintLogoSource(src) {
  if (logoPrintFxEl && src) {
    logoPrintFxEl.style.setProperty("--logo-url", `url("${src}")`);
  }
}

function getPrintLogoEl() {
  return introLogoEl || brandLogoEl;
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

  if (introLogoEl?.naturalWidth > 0 && introLogoEl?.naturalHeight > 0) {
    document.documentElement.style.setProperty(
      "--intro-logo-ratio",
      `${introLogoEl.naturalWidth} / ${introLogoEl.naturalHeight}`,
    );
  }
}

function syncPrintFxSize(sourceLogoEl = getPrintLogoEl()) {
  if (!logoPrintFxEl || !sourceLogoEl) return;
  const r = sourceLogoEl.getBoundingClientRect();
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
  gsap.set(introLogoEl, {
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
    "--studioCut": "0%",
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
  if (section === SECTION.SOCIALS) return document.getElementById("socials");
  if (section === SECTION.CONTACT) return document.getElementById("contact");
  if (section === SECTION.NEWSLETTER) return document.getElementById("newsletter");
  if (section === SECTION.FAQ) return document.getElementById("faq");
  return null;
}

function getSectionScrollY(section) {
  const el = getSectionElement(section);
  if (!el) return window.scrollY;

  if (isMobile()) {
    if (section === SECTION.PROJECTS) {
      return Math.max(0, el.offsetTop);
    }

    return Math.max(0, el.offsetTop - getHeaderOffset());
  }

  return el.offsetTop;
}

function getPlusDockContainer(section) {
  if (isMobile()) {
    if (section === SECTION.HERO) return heroFrameEl;
    if (section === SECTION.ABOUT) return aboutFrameEl;
    if (section === SECTION.PROJECTS) return projectsFrameEl;
    if (section === SECTION.SOCIALS) return socialsFrameEl;
    if (section === SECTION.CONTACT) return contactFrameEl;
    if (section === SECTION.NEWSLETTER) return newsletterFrameEl;
    if (section === SECTION.FAQ) return faqFrameEl;
    return null;
  }

  if (section === SECTION.HERO) return heroFrameEl;
  if (section === SECTION.ABOUT) return aboutTitleEl;
  if (section === SECTION.PROJECTS) return projectsFrameEl;
  if (section === SECTION.SOCIALS) return socialsTitleEl;
  if (section === SECTION.CONTACT) return contactTitleEl;
  if (section === SECTION.NEWSLETTER) return newsletterCardEl;
  if (section === SECTION.FAQ) return faqTitleEl;
  return null;
}

function getTargetFrameRect(section) {
  return getPlusDockContainer(section)?.getBoundingClientRect() || null;
}
function rectAfterScroll(rectNow, dy) {
  return {
    left: rectNow.left,
    right: rectNow.right,
    top: rectNow.top - dy,
    bottom: rectNow.bottom - dy,
  };
}
function settlePluses(section) {
  if (isMobile()) {
    if (!mobileFrozenPlusTargets) {
      dockPlusesToSection(SECTION.HERO);
      mobileFrozenPlusTargets = captureCurrentPlusTargets();
    }

    applyFrozenPlusTargets(mobileFrozenPlusTargets);
  } else {
    applyPlusesInstant(section);
  }
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
function captureCurrentPlusTargets() {
  return {
    tl: plusEls.tl ? plusEls.tl.getBoundingClientRect() : null,
    tr: plusEls.tr ? plusEls.tr.getBoundingClientRect() : null,
    bl: plusEls.bl ? plusEls.bl.getBoundingClientRect() : null,
    br: plusEls.br ? plusEls.br.getBoundingClientRect() : null,
  };
}

function getRectCornerTargets(rect) {
  if (!rect) return null;

  return {
    tl: { left: rect.left, top: rect.top },
    tr: { left: rect.right, top: rect.top },
    bl: { left: rect.left, top: rect.bottom },
    br: { left: rect.right, top: rect.bottom },
  };
}

function getMobileMenuPlusTargets() {
  if (!isMobile() || !mobileMenuEl) return null;
  return getRectCornerTargets(mobileMenuEl.getBoundingClientRect());
}

function applyFrozenPlusTargets(targets) {
  if (!targets) return;

  Object.entries(plusEls).forEach(([key, el]) => {
    const rect = targets[key];
    if (!el || !rect) return;

    document.body.appendChild(el);

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
  });
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
    //terugzetten na coming soon
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

  if (section === SECTION.PROJECTS) {
    loadProjectsScene();
  }

  const startY = window.scrollY;
  const targetY = getSectionScrollY(section);
  const dy = targetY - startY;

  if (isMobile()) {
    snapBusy = true;
    window.scrollTo(0, targetY);
    snapState = section;
    setActiveSectionState(section);
    inputLockUntil = now() + MOBILE_SWIPE_LOCK_MS;
    settlePluses(section);
    requestAnimationFrame(() => {
      snapBusy = false;
    });
    return;
  }

  snapBusy = true;
  inputLockUntil = now() + 900;

  const tl = gsap.timeline({
onComplete: () => {
  snapState = section;
  setActiveSectionState(section);
  snapBusy = false;
  inputLockUntil = now() + 220;
  settlePluses(section);
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
function shouldSnapBackFromSocials() {
  const socialsEl = getSectionElement(SECTION.SOCIALS);
  if (!socialsEl) return false;

  return window.scrollY <= socialsEl.offsetTop + 32;
}

function shouldSnapBackFromContact() {
  const contactEl = getSectionElement(SECTION.CONTACT);
  if (!contactEl) return false;

  return window.scrollY <= contactEl.offsetTop + 32;
}

function shouldSnapBackFromNewsletter() {
  const newsletterEl = getSectionElement(SECTION.NEWSLETTER);
  if (!newsletterEl) return false;

  return window.scrollY <= newsletterEl.offsetTop + 32;
}

function shouldSnapBackFromFaq() {
  const faqEl = getSectionElement(SECTION.FAQ);
  if (!faqEl) return false;

  return window.scrollY <= faqEl.offsetTop + 32;
}

function shouldPinMobileSectionScroll() {
  if (!isMobile() || snapBusy || !introPlayed) return false;
  if (snapState === SECTION.FAQ) return false;

  const targetY = getSectionScrollY(snapState);
  return Math.abs(window.scrollY - targetY) > 2;
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
        if (
          (snapState !== SECTION.PROJECTS || shouldSnapBackFromProjects()) &&
          (snapState !== SECTION.SOCIALS || shouldSnapBackFromSocials()) &&
          (snapState !== SECTION.CONTACT || shouldSnapBackFromContact()) &&
          (snapState !== SECTION.NEWSLETTER || shouldSnapBackFromNewsletter()) &&
          (snapState !== SECTION.FAQ || shouldSnapBackFromFaq())
        ) {
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
        e.preventDefault();

        if (e.deltaY > 0) {
          goToSection(SECTION.SOCIALS);
        } else {
          goToSection(SECTION.ABOUT);
        }
        return;
      }

      if (snapState === SECTION.SOCIALS) {
        e.preventDefault();

        if (e.deltaY > 0) {
          goToSection(SECTION.CONTACT);
        } else if (shouldSnapBackFromSocials()) {
          goToSection(SECTION.PROJECTS);
        }
        return;
      }

      if (snapState === SECTION.CONTACT) {
        e.preventDefault();

        if (e.deltaY > 0) {
          goToSection(SECTION.NEWSLETTER);
        } else if (shouldSnapBackFromContact()) {
          goToSection(SECTION.SOCIALS);
        }
        return;
      }

      if (snapState === SECTION.NEWSLETTER) {
        e.preventDefault();

        if (e.deltaY > 0) {
          goToSection(SECTION.FAQ);
          return;
        }

        if (e.deltaY < 0 && shouldSnapBackFromNewsletter()) {
          goToSection(SECTION.CONTACT);
        }
        return;
      }

      if (snapState === SECTION.FAQ) {
        if (e.deltaY < 0 && shouldSnapBackFromFaq()) {
          e.preventDefault();
          goToSection(SECTION.NEWSLETTER);
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

        if (target.id === "socials") {
          goToSection(SECTION.SOCIALS);
          return;
        }

        if (target.id === "contact") {
          goToSection(SECTION.CONTACT);
          return;
        }

        if (target.id === "newsletter") {
          goToSection(SECTION.NEWSLETTER);
          return;
        }

        if (target.id === "faq") {
          goToSection(SECTION.FAQ);
          return;
        }

        window.scrollTo(0, target.offsetTop - getHeaderOffset());
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

      if (target.id === "socials"){
        goToSection(SECTION.SOCIALS);
        return;
      }

      if (target.id === "contact") {
        goToSection(SECTION.CONTACT);
        return;
      }

      if (target.id === "newsletter") {
        goToSection(SECTION.NEWSLETTER);
        return;
      }

      if (target.id === "faq") {
        goToSection(SECTION.FAQ);
        return;
      }

      scrollToY(target.offsetTop, 0.9);
    });
  });
}

function getNearestSection() {
  const probeY = window.scrollY + getHeaderOffset() + window.innerHeight * 0.2;
  let closest = SECTION.HERO;
  let closestDistance = Number.POSITIVE_INFINITY;

  SECTION_ORDER.forEach((section) => {
    const el = getSectionElement(section);
    if (!el) return;

    const distance = Math.abs(el.offsetTop - probeY);
    if (distance < closestDistance) {
      closest = section;
      closestDistance = distance;
    }
  });

  return closest;
}

function syncMobileSnapState() {
  if (!isMobile() || !introPlayed) return;

  const nextSection = getNearestSection();
  if (nextSection === snapState) return;

  snapState = nextSection;
  settlePluses(nextSection);
}

function syncDesktopSectionState() {
  if (isMobile() || !introPlayed || snapBusy) return;

  const nextSection = getNearestSection();
  if (nextSection === snapState) return;

  snapState = nextSection;
  setActiveSectionState(nextSection);

  if (!plusEls.tl || !plusEls.tr || !plusEls.bl || !plusEls.br) {
    return;
  }

  desktopPlusSyncTween?.kill();

  const tl = gsap.timeline({
    onComplete: () => {
      settlePluses(nextSection);
      desktopPlusSyncTween = null;
    },
  });

  animatePlusesToSection(tl, nextSection, 0, 0.4, 0);
  desktopPlusSyncTween = tl;
}

function getAdjacentSection(section, direction) {
  const index = SECTION_ORDER.indexOf(section);
  if (index === -1) return section;

  const nextIndex = Math.min(
    Math.max(index + direction, 0),
    SECTION_ORDER.length - 1,
  );

  return SECTION_ORDER[nextIndex];
}

function bindMobileSwipeSnap() {
  if (document.documentElement.dataset.mobileSwipeBound === "1") return;
  document.documentElement.dataset.mobileSwipeBound = "1";

  const isMenuOpen = () => document.body.classList.contains("menu-open");

  const shouldIgnoreSwipeTarget = (target) =>
    Boolean(
      target?.closest(
        "input, textarea, select, iframe, .module-body, .projects-desc, .faq-list, .faq-item, .faq-answer, .mobile-menu, .mobile-menu-backdrop, .menu-toggle",
      ),
    );

  window.addEventListener(
    "wheel",
    (e) => {
      if (!isMobile() || !introPlayed) return;
      if (isMenuOpen()) return;
      if (e.target?.closest(".faq-list")) return;
      e.preventDefault();
    },
    { passive: false },
  );

  window.addEventListener(
    "scroll",
    () => {
      if (!isMobile() || snapBusy) return;
      if (isMenuOpen()) return;
      if (shouldPinMobileSectionScroll()) {
        window.scrollTo(0, getSectionScrollY(snapState));
        return;
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "touchstart",
    (e) => {
      if (!isMobile() || !introPlayed) return;
      if (isMenuOpen()) return;
      if (e.touches.length !== 1) return;
      if (shouldIgnoreSwipeTarget(e.target)) return;

      const touch = e.touches[0];
      mobileTouchStartY = touch.clientY;
      mobileTouchStartX = touch.clientX;
      mobileTouchActive = true;
      mobileTouchLockedAxis = "";
      syncMobileSnapState();
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!isMobile() || !introPlayed) return;
      if (isMenuOpen()) return;
      if (e.touches.length !== 1) return;

      if (shouldIgnoreSwipeTarget(e.target)) return;

      const formTarget = e.target?.closest("input, textarea, select");
      if (!formTarget) {
        e.preventDefault();
      }

      if (!mobileTouchActive) return;

      const touch = e.touches[0];
      const dx = touch.clientX - mobileTouchStartX;
      const dy = touch.clientY - mobileTouchStartY;

      if (!mobileTouchLockedAxis) {
        if (Math.abs(dy) > 8 || Math.abs(dx) > 8) {
          mobileTouchLockedAxis = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
        }
      }
    },
    { passive: false },
  );

  window.addEventListener(
    "touchend",
    (e) => {
      if (!mobileTouchActive || !isMobile() || !introPlayed) return;
      if (isMenuOpen()) {
        mobileTouchActive = false;
        return;
      }

      mobileTouchActive = false;

      if (snapBusy || now() < inputLockUntil) return;
      if (shouldIgnoreSwipeTarget(e.target)) return;

      const touch = e.changedTouches?.[0];
      if (!touch) return;

      const deltaY = touch.clientY - mobileTouchStartY;
      const deltaX = touch.clientX - mobileTouchStartX;

      if (Math.abs(deltaY) < MOBILE_SWIPE_MIN) return;
      if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

      syncMobileSnapState();

      const direction = deltaY < 0 ? 1 : -1;
      const nextSection = getAdjacentSection(snapState, direction);
      if (nextSection === snapState) return;

      goToSection(nextSection);
    },
    { passive: true },
  );
}

function bindDesktopSectionSync() {
  if (document.documentElement.dataset.desktopSectionSyncBound === "1") return;
  document.documentElement.dataset.desktopSectionSyncBound = "1";

  window.addEventListener(
    "scroll",
    () => {
      if (isMobile() || snapBusy || !introPlayed) return;

      if (desktopSectionSyncRaf) {
        cancelAnimationFrame(desktopSectionSyncRaf);
      }

      desktopSectionSyncRaf = requestAnimationFrame(() => {
        desktopSectionSyncRaf = 0;
        syncDesktopSectionState();
      });
    },
    { passive: true },
  );
}

function refreshResponsiveLayout() {
  syncLogoUrl();
  syncMountSize();
  syncPrintFxSize();

  if (!introPlayed) return;

  if (isMobile()) {
    mobileFrozenPlusTargets = null;
    dockPlusesToSection(SECTION.HERO);
    mobileFrozenPlusTargets = captureCurrentPlusTargets();
    if (document.body.classList.contains("menu-open")) {
      dockPlusesToContainer(mobileMenuEl);
    } else {
      applyFrozenPlusTargets(mobileFrozenPlusTargets);
    }
    return;
  }

  mobileFrozenPlusTargets = null;
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
    requestAnimationFrame(() => {
      dockPlusesToContainer(mobileMenu);
    });
  };

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenuBackdrop.setAttribute("aria-hidden", "true");
    applyFrozenPlusTargets(mobileFrozenPlusTargets);
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
    if (link.dataset.mobileMenuBound === "1") return;
    link.dataset.mobileMenuBound = "1";
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

  document.body.classList.remove("intro-complete");
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

  const printLogoEl = getPrintLogoEl();
  const landingRect = landingMarkEl.getBoundingClientRect();
  const mountRect = logoMountEl.getBoundingClientRect();
  const baseRect = printLogoEl.getBoundingClientRect();

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
    "--studioCut": "0%",
  });

  const LAYERS = 25;
  const TIME_PER_LAYER = 0.07;
  const PRINT_DUR = LAYERS * TIME_PER_LAYER;
  const MOVE_DUR = 1.4;
  const MOVE_START = PRINT_DUR;
  const STUDIO_CUT_START = MOVE_START + 0.28;
  const INTRO_LAND = MOVE_START + MOVE_DUR;
  const UI_FADE_DUR = 0.18;
  const UI_APPEAR = INTRO_LAND - UI_FADE_DUR;

  logoPrintFxEl.style.setProperty("--layerH", `${100 / LAYERS}%`);

  const printState = { t: 0 };
  let introUiShown = false;
  let introFinished = false;

  function showIntroUi() {
    if (introUiShown) return;
    introUiShown = true;
    document.body.classList.remove("is-intro");
  }

  function finishIntro() {
    if (introFinished) return;
    introFinished = true;

    showIntroUi();
    document.body.classList.add("intro-complete");
    gsap.set(logoPrintFxEl, { opacity: 0 });
    gsap.set(logoMountEl, { opacity: 1 });
    settlePluses(SECTION.HERO);
    snapState = SECTION.HERO;
    setActiveSectionState(SECTION.HERO);

    if (isMobile()) {
      mobileFrozenPlusTargets = captureCurrentPlusTargets();
    }

    lockScroll(false);
    bindDesktopWheelSnap();

    requestAnimationFrame(() => {
      refreshResponsiveLayout();
    });
  }

  const tl = gsap.timeline({
    onComplete: () => {
      finishIntro();
    },

//coming soon
// onComplete: () => {
//   gsap.set(logoPrintFxEl, {
//     x: startX,
//     y: startY,
//     scale: startScale,
//     opacity: 1,
//   });

//   gsap.set(landingPlusEls, { opacity: 0 });
//   gsap.set(Object.values(plusEls), { opacity: 0 });
//   gsap.set(logoMountEl, { opacity: 0 });

//   document.body.classList.remove("is-intro");

//   document.documentElement.style.overflow = "hidden";
//   document.body.style.overflow = "hidden";

//   gsap.to(landingComingSoonEl, {
//     opacity: 1,
//     duration: 0.35,
//     ease: "power2.out",
//   });
// },
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
  //terugzetten na coming soon
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

  tl.to(
    logoPrintFxEl,
    {
      "--studioCut": "20%",
      duration: 0.32,
      ease: "power2.out",
    },
    STUDIO_CUT_START,
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

  tl.call(showIntroUi, null, UI_APPEAR);
  tl.to(landingPlusEls, { opacity: 0, duration: UI_FADE_DUR, ease: "none" }, UI_APPEAR);
  tl.to(Object.values(plusEls), { opacity: 1, duration: UI_FADE_DUR, ease: "none" }, UI_APPEAR);
  tl.call(finishIntro, null, INTRO_LAND);
  tl.to(landingEl, { autoAlpha: 0, duration: 0.1, ease: "none" }, INTRO_LAND);
}

let resizeTimer = 0;
function dockPlusesToSection(section) {
  const container = getPlusDockContainer(section);

  dockPlusesToContainer(container);
}

function dockPlusesToContainer(container) {

  if (!container) return;

  Object.entries(plusEls).forEach(([key, el]) => {
    if (!el) return;

    container.appendChild(el);

    gsap.set(el, {
      position: "absolute",
      x: 0,
      y: 0,
      margin: 0,
      zIndex: PLUS_Z,
      opacity: 1,
      clearProps: "left,top,right,bottom",
    });

    el.style.left = "";
    el.style.right = "";
    el.style.top = "";
    el.style.bottom = "";
    el.style.visibility = "";

    if (key === "tl") {
      el.style.left = "0";
      el.style.top = "0";
    }

    if (key === "tr") {
      el.style.right = "0";
      el.style.top = "0";
    }

    if (key === "bl") {
      el.style.left = "0";
      el.style.bottom = "0";
    }

    if (key === "br") {
      el.style.right = "0";
      el.style.bottom = "0";
    }
  });
}
function bindResizeHandling() {
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(() => {
      if (isMobile()) return;
      refreshResponsiveLayout();
    }, 120);
  });

  window.addEventListener("orientationchange", () => {
    clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(() => {
      if (isMobile()) {
        mobileFrozenPlusTargets = null;
      }
      refreshResponsiveLayout();
    }, 260);
  });
}

function bindFaqAccordion() {
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const trigger = item.querySelector(".faq-question");
    if (!trigger || trigger.dataset.bound === "1") return;

    trigger.dataset.bound = "1";

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const willOpen = !item.classList.contains("is-open");

      faqItems.forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
      });

      if (willOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function setupProjectsLazyLoader() {
  const projectsEl = getSectionElement(SECTION.PROJECTS);
  if (!projectsEl) return;

  if (window.location.hash === `#${SECTION.PROJECTS}`) {
    loadProjectsScene();
    return;
  }

  if (!("IntersectionObserver" in window)) {
    window.addEventListener("scroll", loadProjectsScene, { once: true, passive: true });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting) return;

      observer.disconnect();
      loadProjectsScene();
    },
    { rootMargin: "900px 0px", threshold: 0 },
  );

  observer.observe(projectsEl);
}

async function boot() {
  await Promise.all(
    [brandLogoEl, introLogoEl].filter(Boolean).map(async (img) => {
      try {
        await img.decode();
      } catch {}
    }),
  );

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
  bindMobileSwipeSnap();
  bindDesktopSectionSync();
  bindResizeHandling();
  bindFaqAccordion();
  setupProjectsLazyLoader();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      playIntro();
    });
  });
}

boot();
