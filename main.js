import gsap from "https://esm.sh/gsap@3.12.2";
import ScrollToPlugin from "https://esm.sh/gsap@3.12.2/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

const BREAKPOINT = 900;
const SNAP_DUR = 0.9;
const PLUS_Z = 99999;
const MOBILE_SWIPE_MIN = 52;
const MOBILE_SWIPE_LOCK_MS = 260;
const MOBILE_SWIPE_HINT_KEY = "oddunit.mobileSwipeHintSeen.v2";
const INTRO_SEEN_KEY = "oddunit.introSeen.v1";

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
let serviceTouchStartY = 0;
let serviceTouchStartX = 0;
let serviceTouchActive = false;
let serviceTouchLockedAxis = "";
let serviceSnapIndex = 0;
let serviceSnapBusy = false;
let servicePlusActiveIndex = -1;
let servicePlusRaf = 0;
let desktopSectionSyncRaf = 0;
let desktopPlusSyncTween = null;
let projectsScenePromise = null;
let mobileSwipeHintTimer = 0;
const mobileMq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);
const hasHomeExperience = Boolean(
  landingEl &&
    landingMarkEl &&
    brandLogoEl &&
    logoMountEl &&
    logoPrintFxEl &&
    heroFrameEl,
);

function hasSeenIntro() {
  try {
    return window.sessionStorage?.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    window.sessionStorage?.setItem(INTRO_SEEN_KEY, "1");
  } catch {}
}

function loadProjectsScene() {
  if (!projectsScenePromise) {
    projectsScenePromise = import("./projects/projects.js").catch((error) => {
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
  const cssOffset =
    parseFloat(styles.getPropertyValue("--headerH")) ||
    parseFloat(styles.getPropertyValue("--topbar-h")) ||
    parseFloat(styles.getPropertyValue("--navZoneH"));

  if (Number.isFinite(cssOffset) && cssOffset > 0) return cssOffset;

  const topbarRect = document.querySelector(".topbar")?.getBoundingClientRect();
  return topbarRect?.height || topbarRect?.bottom || 0;
}

function scrollToY(y, duration = SNAP_DUR) {
  if (gsap.plugins && gsap.plugins.ScrollToPlugin) {
    return gsap.to(window, {
      scrollTo: { y, autoKill: false },
      duration,
      ease: "power2.inOut",
      overwrite: true,
    });
  }

  const start = window.scrollY;
  const delta = y - start;
  const state = { t: 0 };

  return gsap.to(state, {
    t: 1,
    duration,
    ease: "power2.inOut",
    overwrite: true,
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
  if (!getSectionElement(section)) return;

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
  inputLockUntil = now() + SNAP_DUR * 1000;

  const tl = gsap.timeline({
onComplete: () => {
  window.scrollTo(0, getSectionScrollY(section));

  snapState = section;
  setActiveSectionState(section);
  settlePluses(section);

  inputLockUntil = now() + 120;

  requestAnimationFrame(() => {
    snapBusy = false;
  });
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

function getExistingSectionOrder() {
  return SECTION_ORDER.filter((section) => getSectionElement(section));
}

function goToAdjacentSection(section, direction) {
  const nextSection = getAdjacentSection(section, direction);
  if (nextSection !== section) {
    goToSection(nextSection);
  }
}

function bindDesktopWheelSnap() {
  if (wheelBound) return;
  wheelBound = true;

  window.addEventListener(
    "wheel",
    (e) => {
      if (isMobile()) return;
      if (!introPlayed) return;

      if (e.deltaY === 0) return;

      if (snapBusy || now() < inputLockUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (snapState === SECTION.HERO) {
        if (e.deltaY > 0) {
          e.preventDefault();
          goToAdjacentSection(SECTION.HERO, 1);
        }
        return;
      }

      if (snapState === SECTION.ABOUT) {
        e.preventDefault();

        if (e.deltaY > 0) {
          goToAdjacentSection(SECTION.ABOUT, 1);
        } else {
          goToAdjacentSection(SECTION.ABOUT, -1);
        }
        return;
      }

      if (snapState === SECTION.PROJECTS) {
        e.preventDefault();

        if (e.deltaY > 0) {
          goToAdjacentSection(SECTION.PROJECTS, 1);
        } else {
          goToAdjacentSection(SECTION.PROJECTS, -1);
        }
        return;
      }

      if (snapState === SECTION.SOCIALS) {
        e.preventDefault();

        if (e.deltaY > 0) {
          goToAdjacentSection(SECTION.SOCIALS, 1);
        } else if (shouldSnapBackFromSocials()) {
          goToAdjacentSection(SECTION.SOCIALS, -1);
        }
        return;
      }

      if (snapState === SECTION.CONTACT) {
        e.preventDefault();

        if (e.deltaY > 0) {
          goToAdjacentSection(SECTION.CONTACT, 1);
        } else if (shouldSnapBackFromContact()) {
          goToAdjacentSection(SECTION.CONTACT, -1);
        }
        return;
      }

      if (snapState === SECTION.NEWSLETTER) {
        e.preventDefault();

        if (e.deltaY > 0) {
          goToAdjacentSection(SECTION.NEWSLETTER, 1);
          return;
        }

        if (e.deltaY < 0 && shouldSnapBackFromNewsletter()) {
          goToAdjacentSection(SECTION.NEWSLETTER, -1);
        }
        return;
      }

      if (snapState === SECTION.FAQ) {
        if (e.deltaY < 0 && shouldSnapBackFromFaq()) {
          e.preventDefault();
          goToAdjacentSection(SECTION.FAQ, -1);
        }
      }
    },
    { passive: false },
  );
}

function bindScrollTriggers() {
  if (!hasHomeExperience) return;

  const triggers = document.querySelectorAll('a[href^="#"]');

  triggers.forEach((trigger) => {
    if (!trigger || trigger.dataset.scrollBound === "1") return;
    trigger.dataset.scrollBound = "1";

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
  const existingOrder = getExistingSectionOrder();
  const index = existingOrder.indexOf(section);

  if (index === -1) {
    const sectionIndex = SECTION_ORDER.indexOf(section);
    if (sectionIndex === -1) return section;

    const candidates =
      direction > 0
        ? existingOrder.filter((item) => SECTION_ORDER.indexOf(item) > sectionIndex)
        : existingOrder.filter((item) => SECTION_ORDER.indexOf(item) < sectionIndex).reverse();

    return candidates[0] || section;
  }

  const nextIndex = Math.min(
    Math.max(index + direction, 0),
    existingOrder.length - 1,
  );

  return existingOrder[nextIndex];
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

function getServiceSnapTargets() {
  if (!document.body.classList.contains("service-page")) return [];

  const selector = isMobile()
    ? ".service-main > .service-hero, .service-main > .service-packages, .service-main > .service-faq, .service-main > .service-cta, .service-main > .cases-section"
    : ".service-main > .service-hero, .service-main > .service-packages, .service-main > .service-faq, .service-main > .service-cta, .service-main > .cases-section";

  return Array.from(
    document.querySelectorAll(selector),
  );
}

function getServicePanelGap() {
  const raw =
    getComputedStyle(document.body).getPropertyValue("--servicePanelGap") ||
    getComputedStyle(document.documentElement).getPropertyValue("--servicePanelGap");
  const val = parseFloat(raw);
  return Number.isFinite(val) ? val : 8;
}

function getServiceSnapY(target) {
  if (!target) return 0;
  if (!isMobile()) return Math.max(0, target.offsetTop - getHeaderOffset());
  return Math.max(0, target.offsetTop - getHeaderOffset() - getServicePanelGap());
}

function getNearestServiceSnapIndex() {
  const targets = getServiceSnapTargets();
  if (!targets.length) return 0;

  const probeY =
    window.scrollY + getHeaderOffset() + getServicePanelGap() + window.innerHeight * 0.22;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  targets.forEach((target, index) => {
    const distance = Math.abs(target.offsetTop - probeY);
    if (distance < closestDistance) {
      closestIndex = index;
      closestDistance = distance;
    }
  });

  return closestIndex;
}

function getServiceSnapTargetIndexForElement(el) {
  const targets = getServiceSnapTargets();
  if (!targets.length || !el?.closest) return -1;

  const snapTarget = el.closest(
    ".service-main > .service-hero, .service-main > .service-grid, .service-main > .service-packages, .service-main > .service-faq, .service-main > .service-cta, .service-main > .cases-section",
  );

  return targets.indexOf(snapTarget);
}

function getServicePanelKey(target, fallbackIndex = 0) {
  if (!target) return "hero";
  if (target.dataset.servicePanel) return target.dataset.servicePanel;
  if (target.classList.contains("service-hero")) return "hero";
  if (target.classList.contains("service-packages")) return "packages";
  if (target.classList.contains("service-faq")) return "faq";
  if (target.classList.contains("cases-section")) return "cases";
  if (target.classList.contains("service-cta")) return "contact";
  return `panel-${fallbackIndex}`;
}

function setServiceActivePanelState(index) {
  if (!document.body.classList.contains("service-page")) return;

  const targets = getServiceSnapTargets();
  const clampedIndex = targets.length
    ? Math.min(Math.max(index, 0), targets.length - 1)
    : 0;
  const panel = getServicePanelKey(targets[clampedIndex], clampedIndex);

  document.documentElement.dataset.serviceActivePanel = panel;
  document.body.dataset.serviceActivePanel = panel;
}

function goToServiceSnapIndex(index) {
  const targets = getServiceSnapTargets();
  if (!targets.length) return;

  const nextIndex = Math.min(Math.max(index, 0), targets.length - 1);
  const targetY = getServiceSnapY(targets[nextIndex]);

  serviceSnapBusy = true;
  serviceSnapIndex = nextIndex;
  setServiceActivePanelState(nextIndex);
  inputLockUntil = now() + (isMobile() ? MOBILE_SWIPE_LOCK_MS : SNAP_DUR * 1000);

  if (isMobile()) {
    window.scrollTo(0, targetY);

    requestAnimationFrame(() => {
      serviceSnapBusy = false;
    });
    return;
  }

  const dy = targetY - window.scrollY;
  const tl = gsap.timeline({
    onComplete: () => {
      window.scrollTo(0, getServiceSnapY(targets[nextIndex]));
      serviceSnapIndex = nextIndex;
      setServiceActivePanelState(nextIndex);
      servicePlusActiveIndex = nextIndex;
      inputLockUntil = now() + 120;
      applyServicePlusesInstant(nextIndex);

      requestAnimationFrame(() => {
        serviceSnapBusy = false;
      });
    },
  });

  tl.add(scrollToY(targetY, SNAP_DUR), 0);
  animateServicePlusesToIndex(tl, nextIndex, dy, SNAP_DUR, 0);
}

function syncServiceSnapState() {
  serviceSnapIndex = getNearestServiceSnapIndex();
  setServiceActivePanelState(serviceSnapIndex);
}

function syncInitialServiceSnapFromHash() {
  if (!isMobile()) {
    syncServiceSnapState();
    return;
  }

  const rawHash = window.location.hash.slice(1);
  if (!rawHash) {
    syncServiceSnapState();
    return;
  }

  let id = rawHash;
  try {
    id = decodeURIComponent(rawHash);
  } catch {}

  const target = document.getElementById(id);
  const index = getServiceSnapTargetIndexForElement(target);
  if (index < 0) {
    syncServiceSnapState();
    return;
  }

  serviceSnapIndex = index;
  setServiceActivePanelState(index);

  requestAnimationFrame(() => {
    window.scrollTo(0, getServiceSnapY(getServiceSnapTargets()[serviceSnapIndex]));
  });
}

function shouldPinServiceMobileSnap() {
  if (!isMobile() || serviceSnapBusy) return false;

  const targets = getServiceSnapTargets();
  if (!targets.length) return false;

  const target = targets[serviceSnapIndex] || targets[getNearestServiceSnapIndex()];
  if (!target) return false;

  return Math.abs(window.scrollY - getServiceSnapY(target)) > 2;
}

function syncServiceFixedPluses() {
  if (!document.body.classList.contains("service-page")) return;
  if (hasHomeExperience) return;

  const frame = document.querySelector(".service-frame");
  if (!frame) return;

  const pluses = Array.from(document.querySelectorAll(".service-plus"));
  pluses.forEach((plus) => {
    if (plus.parentElement !== document.body) {
      document.body.appendChild(plus);
    }
    plus.dataset.servicePlusDocked = "1";
  });
}

function getServicePlusKey(plus) {
  if (plus.classList.contains("service-plus--tl")) return "tl";
  if (plus.classList.contains("service-plus--tr")) return "tr";
  if (plus.classList.contains("service-plus--bl")) return "bl";
  if (plus.classList.contains("service-plus--br")) return "br";
  return "";
}

function getServicePlusTargetRect(index) {
  const targets = getServiceSnapTargets();
  const target = targets[Math.min(Math.max(index, 0), targets.length - 1)];
  if (!target) return null;

  if (target.classList.contains("service-hero") || target.classList.contains("service-grid")) {
    return document.querySelector(".service-frame")?.getBoundingClientRect() || null;
  }

  return target.getBoundingClientRect();
}

function getServicePlusCornerTargets(index, dy = 0) {
  const rect = getServicePlusTargetRect(index);
  if (!rect) return null;
  const minTop = document.querySelector(".topbar")?.getBoundingClientRect().bottom || getHeaderOffset();
  const top = rect.top - dy;
  const bottom = rect.bottom - dy;

  return {
    tl: { left: rect.left, top: Math.max(top, minTop) },
    tr: { left: rect.right, top: Math.max(top, minTop) },
    bl: { left: rect.left, top: bottom },
    br: { left: rect.right, top: bottom },
  };
}

function moveServicePlusesToIndex(index, immediate = false, dy = 0) {
  const targets = getServicePlusCornerTargets(index, dy);
  if (!targets) return;

  Array.from(document.querySelectorAll(".service-plus")).forEach((plus) => {
    const key = getServicePlusKey(plus);
    const target = targets[key];
    if (!target) return;

    plus.getAnimations?.().forEach((animation) => animation.cancel());

    if (plus.parentElement !== document.body) {
      const current = plus.getBoundingClientRect();
      document.body.appendChild(plus);
      gsap.set(plus, {
        position: "fixed",
        left: current.left,
        top: current.top,
        x: 0,
        y: 0,
        margin: 0,
        zIndex: PLUS_Z,
        opacity: 1,
      });
    }

    plus.dataset.servicePlusDocked = "1";
    plus.style.right = "";
    plus.style.bottom = "";
    plus.style.visibility = "";

    if (immediate) {
      gsap.set(plus, {
        position: "fixed",
        left: target.left,
        top: target.top,
        x: 0,
        y: 0,
        margin: 0,
        zIndex: PLUS_Z,
        opacity: 1,
        clearProps: "transform",
      });
      return;
    }

    const current = plus.getBoundingClientRect();
    gsap.set(plus, {
      position: "fixed",
      left: current.left,
      top: current.top,
      x: 0,
      y: 0,
      margin: 0,
      zIndex: PLUS_Z,
      opacity: 1,
      clearProps: "transform",
    });

    gsap.to(plus, {
      left: target.left,
      top: target.top,
      x: 0,
      y: 0,
      duration: 0.72,
      ease: "power2.inOut",
      overwrite: true,
    });
  });
}

function applyServicePlusesInstant(index) {
  const targets = getServicePlusCornerTargets(index);
  if (!targets) return;

  Array.from(document.querySelectorAll(".service-plus")).forEach((plus) => {
    const key = getServicePlusKey(plus);
    const target = targets[key];
    if (!target) return;

    plus.getAnimations?.().forEach((animation) => animation.cancel());
    gsap.killTweensOf(plus);

    document.body.appendChild(plus);
    plus.dataset.servicePlusDocked = "1";
    plus.style.right = "";
    plus.style.bottom = "";
    plus.style.visibility = "";

    gsap.set(plus, {
      position: "fixed",
      left: target.left,
      top: target.top,
      x: 0,
      y: 0,
      margin: 0,
      zIndex: PLUS_Z,
      opacity: 1,
      clearProps: "transform",
    });
  });
}

function animateServicePlusesToIndex(tl, index, dy = 0, duration = SNAP_DUR, at = 0) {
  const targets = getServicePlusCornerTargets(index, dy);
  if (!targets) return;

  Array.from(document.querySelectorAll(".service-plus")).forEach((plus) => {
    const key = getServicePlusKey(plus);
    const target = targets[key];
    if (!target) return;

    plus.getAnimations?.().forEach((animation) => animation.cancel());
    gsap.killTweensOf(plus);

    const start = normalizeFixedPosition(plus);
    plus.dataset.servicePlusDocked = "1";

    tl.to(
      plus,
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

function pulseServicePluses() {
  if (!document.body.classList.contains("service-page")) return;

  const offsets = {
    "service-plus--tl": [18, 18],
    "service-plus--tr": [-18, 18],
    "service-plus--bl": [18, -18],
    "service-plus--br": [-18, -18],
  };

  document.querySelectorAll(".service-plus").forEach((plus, index) => {
    const className = Object.keys(offsets).find((name) => plus.classList.contains(name));
    const [x, y] = offsets[className] || [0, 0];

    plus.getAnimations?.().forEach((animation) => animation.cancel());
    plus.animate?.(
      [
        { transform: `translate(${x}px, ${y}px) rotate(${index % 2 ? -70 : 70}deg) scale(.58)` },
        { transform: "translate(0, 0) rotate(0deg) scale(1.12)", offset: 0.72 },
        { transform: "translate(0, 0) rotate(0deg) scale(1)" },
      ],
      {
        duration: isMobile() ? 420 : 560,
        easing: "cubic-bezier(.2,.8,.2,1)",
      },
    );
  });
}

function syncServicePlusAnimation(force = false) {
  if (!document.body.classList.contains("service-page")) return;
  if (isMobile()) return;
  if (serviceSnapBusy) return;

  const nextIndex = getNearestServiceSnapIndex();
  if (!force && nextIndex === servicePlusActiveIndex) return;

  servicePlusActiveIndex = nextIndex;
  if (force) {
    applyServicePlusesInstant(nextIndex);
  } else {
    moveServicePlusesToIndex(nextIndex);
  }
}

function bindServicePlusAnimation() {
  if (!document.body.classList.contains("service-page")) return;
  if (hasHomeExperience) return;
  if (document.documentElement.dataset.servicePlusAnimationBound === "1") return;
  document.documentElement.dataset.servicePlusAnimationBound = "1";

  const requestSync = () => {
    if (servicePlusRaf) return;
    servicePlusRaf = requestAnimationFrame(() => {
      servicePlusRaf = 0;
      if (serviceSnapBusy) return;
      syncServicePlusAnimation();
    });
  };

  syncServicePlusAnimation(true);
  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener(
    "resize",
    () => {
      servicePlusActiveIndex = -1;
      syncServiceFixedPluses();
      requestSync();
    },
    { passive: true },
  );
}

function bindServiceFixedPluses() {
  if (!document.body.classList.contains("service-page")) return;
  if (hasHomeExperience) return;
  if (document.documentElement.dataset.servicePlusesBound === "1") return;
  document.documentElement.dataset.servicePlusesBound = "1";

  syncServiceFixedPluses();
  window.addEventListener("resize", syncServiceFixedPluses, { passive: true });
}

function bindServiceDesktopWheelSnap() {
  if (!document.body.classList.contains("service-page")) return;
  if (hasHomeExperience) return;
  if (document.documentElement.dataset.serviceDesktopWheelBound === "1") return;
  document.documentElement.dataset.serviceDesktopWheelBound = "1";

  const isMenuOpen = () => document.body.classList.contains("menu-open");

  window.addEventListener(
    "wheel",
    (e) => {
      if (isMobile() || isMenuOpen()) return;
      if (e.deltaY === 0) return;
      if (getServiceSnapTargets().length < 2) return;

      e.preventDefault();
      e.stopPropagation();

      if (serviceSnapBusy || now() < inputLockUntil) return;

      syncServiceSnapState();
      goToServiceSnapIndex(serviceSnapIndex + (e.deltaY > 0 ? 1 : -1));
    },
    { passive: false },
  );

  window.addEventListener(
    "resize",
    () => {
      if (isMobile()) return;
      syncServiceSnapState();
      moveServicePlusesToIndex(serviceSnapIndex, true);
    },
    { passive: true },
  );
}

function bindServiceMobileSwipeSnap() {
  if (!document.body.classList.contains("service-page")) return;
  if (hasHomeExperience) return;
  if (document.documentElement.dataset.serviceMobileSwipeBound === "1") return;
  document.documentElement.dataset.serviceMobileSwipeBound = "1";

  const isMenuOpen = () => document.body.classList.contains("menu-open");
  const shouldIgnoreSwipeTarget = (target) =>
    Boolean(
      target?.closest?.(
        "input, textarea, select, iframe, .service-grid .service-section, .service-package-rail, .service-package-grid, .service-package, .service-packages__arrow, .case-grid--inline, .case-card, .mobile-menu, .mobile-menu-backdrop, .menu-toggle",
      ),
    );

  document.querySelectorAll('body.service-page a[href^="#"]').forEach((link) => {
    if (link.dataset.serviceSnapLinkBound === "1") return;
    link.dataset.serviceSnapLinkBound = "1";

    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      const index = getServiceSnapTargetIndexForElement(target);
      if (index < 0) return;

      e.preventDefault();
      history.pushState(null, "", href);
      goToServiceSnapIndex(index);
    });
  });

  window.addEventListener(
    "wheel",
    (e) => {
      if (!isMobile() || isMenuOpen()) return;
      const targets = getServiceSnapTargets();
      if (targets.length < 2) return;

      const absY = Math.abs(e.deltaY);
      if (absY < 12) return;

      e.preventDefault();

      if (serviceSnapBusy || now() < inputLockUntil) return;

      syncServiceSnapState();
      goToServiceSnapIndex(serviceSnapIndex + (e.deltaY > 0 ? 1 : -1));
    },
    { passive: false },
  );

  window.addEventListener(
    "touchstart",
    (e) => {
      if (!isMobile() || isMenuOpen()) return;
      if (e.touches.length !== 1) return;
      if (shouldIgnoreSwipeTarget(e.target)) return;
      if (getServiceSnapTargets().length < 2) return;

      const touch = e.touches[0];
      serviceTouchStartY = touch.clientY;
      serviceTouchStartX = touch.clientX;
      serviceTouchActive = true;
      serviceTouchLockedAxis = "";
      syncServiceSnapState();
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      if (!serviceTouchActive || !isMobile() || isMenuOpen()) return;
      if (e.touches.length !== 1) return;
      if (shouldIgnoreSwipeTarget(e.target)) return;

      e.preventDefault();

      const touch = e.touches[0];
      const deltaY = touch.clientY - serviceTouchStartY;
      const deltaX = touch.clientX - serviceTouchStartX;

      if (!serviceTouchLockedAxis && (Math.abs(deltaY) > 8 || Math.abs(deltaX) > 8)) {
        serviceTouchLockedAxis = Math.abs(deltaY) > Math.abs(deltaX) ? "y" : "x";
      }
    },
    { passive: false },
  );

  window.addEventListener(
    "scroll",
    () => {
      if (!isMobile() || isMenuOpen()) return;
      if (shouldPinServiceMobileSnap()) {
        window.scrollTo(0, getServiceSnapY(getServiceSnapTargets()[serviceSnapIndex]));
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "touchend",
    (e) => {
      if (!serviceTouchActive || !isMobile() || isMenuOpen()) return;
      serviceTouchActive = false;

      if (serviceSnapBusy || now() < inputLockUntil) return;
      if (shouldIgnoreSwipeTarget(e.target)) return;

      const touch = e.changedTouches?.[0];
      if (!touch) return;

      const deltaY = touch.clientY - serviceTouchStartY;
      const deltaX = touch.clientX - serviceTouchStartX;

      if (Math.abs(deltaY) < MOBILE_SWIPE_MIN) return;
      if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

      syncServiceSnapState();
      goToServiceSnapIndex(serviceSnapIndex + (deltaY < 0 ? 1 : -1));
    },
    { passive: true },
  );

  window.addEventListener(
    "resize",
    () => {
      if (!isMobile()) return;
      syncServiceSnapState();
      window.scrollTo(0, getServiceSnapY(getServiceSnapTargets()[serviceSnapIndex]));
    },
    { passive: true },
  );

  syncInitialServiceSnapFromHash();
}

function hasSeenMobileSwipeHint() {
  try {
    return window.localStorage?.getItem(MOBILE_SWIPE_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function markMobileSwipeHintSeen() {
  try {
    window.localStorage?.setItem(MOBILE_SWIPE_HINT_KEY, "1");
  } catch {}
}

function hideMobileSwipeHint(persist = true) {
  const hint = document.getElementById("mobileSwipeHint");
  if (mobileSwipeHintTimer) {
    window.clearTimeout(mobileSwipeHintTimer);
    mobileSwipeHintTimer = 0;
  }

  document.body.classList.remove("show-mobile-swipe-hint");

  if (hint) {
    hint.setAttribute("aria-hidden", "true");
  }

  if (persist) {
    markMobileSwipeHintSeen();
  }
}

function showMobileSwipeHint() {
  const hint = document.getElementById("mobileSwipeHint");
  if (!hint || !isMobile() || hasSeenMobileSwipeHint()) return;
  if (!introPlayed || document.body.classList.contains("menu-open")) return;
  if (snapState !== SECTION.HERO || window.location.hash) return;

  hint.setAttribute("aria-hidden", "false");
  document.body.classList.add("show-mobile-swipe-hint");
  markMobileSwipeHintSeen();

  mobileSwipeHintTimer = window.setTimeout(() => {
    hideMobileSwipeHint(false);
  }, 6500);
}

function bindMobileSwipeHint() {
  if (document.documentElement.dataset.mobileSwipeHintBound === "1") return;
  document.documentElement.dataset.mobileSwipeHintBound = "1";

  const dismiss = () => {
    if (document.body.classList.contains("show-mobile-swipe-hint")) {
      hideMobileSwipeHint();
    }
  };

  window.addEventListener("touchstart", dismiss, { passive: true });
  window.addEventListener("wheel", dismiss, { passive: true });
  window.addEventListener("keydown", dismiss);
  window.addEventListener("click", dismiss);

  const handleMqChange = () => {
    if (!isMobile()) hideMobileSwipeHint(false);
  };

  if (typeof mobileMq.addEventListener === "function") {
    mobileMq.addEventListener("change", handleMqChange);
  } else if (typeof mobileMq.addListener === "function") {
    mobileMq.addListener(handleMqChange);
  }
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
      const clickedStripLink = e.target.closest(".module-strip__link");
      const clickedBody = e.target.closest(".module-body");
      const isOpen = module.classList.contains("is-open");

      if (clickedStripLink) return;

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

function bindServiceOverviewModules() {
  if (!document.body.classList.contains("service-page")) return;

  document.querySelectorAll(".service-grid .service-section").forEach((section) => {
    if (section.dataset.serviceModuleBound === "1") return;
    section.dataset.serviceModuleBound = "1";

    const syncInteractiveState = () => {
      if (isMobile()) {
        section.setAttribute("role", "button");
        section.setAttribute("tabindex", "0");
        section.setAttribute(
          "aria-expanded",
          section.classList.contains("is-open") ? "true" : "false",
        );
        return;
      }

      section.classList.remove("is-open");
      section.removeAttribute("role");
      section.removeAttribute("tabindex");
      section.removeAttribute("aria-expanded");
    };

    syncInteractiveState();
    window.addEventListener("resize", syncInteractiveState, { passive: true });

    const closeSiblings = () => {
      section.closest(".service-grid")?.querySelectorAll(".service-section.is-open").forEach((other) => {
        if (other === section) return;
        other.classList.remove("is-open");
        other.setAttribute("aria-expanded", "false");
      });
    };

    const toggle = () => {
      if (!isMobile()) return;

      const willOpen = !section.classList.contains("is-open");
      closeSiblings();
      section.classList.toggle("is-open", willOpen);
      section.setAttribute("aria-expanded", willOpen ? "true" : "false");
    };

    section.addEventListener("click", (e) => {
      if (!isMobile()) return;
      if (e.target.closest("a, button, input, textarea, select, label")) return;

      e.preventDefault();
      toggle();
    });

    section.addEventListener("keydown", (e) => {
      if (!isMobile()) return;
      if (e.key !== "Enter" && e.key !== " ") return;

      e.preventDefault();
      toggle();
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
const logoRatio = baseRect.height / Math.max(1, baseRect.width);

const startW = landingRect.width;
const startH = startW * logoRatio;

const startX = landingRect.left + (landingRect.width - startW) / 2;
const startY = landingRect.top + (landingRect.height - startH) / 2;

const endX = mountRect.left;
const endY = mountRect.top;
const endScale = mountRect.width / Math.max(1, startW);

logoPrintFxEl.style.width = `${startW}px`;
logoPrintFxEl.style.height = `${startH}px`;

  const heroTargets = getSectionCornerTargets(SECTION.HERO);

  gsap.set(landingPlusEls, { opacity: 0.95 });

gsap.set(logoPrintFxEl, {
  opacity: 1,
  x: startX,
  y: startY,
  scale: 1,
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
    markIntroSeen();
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
      showMobileSwipeHint();
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
    scale: endScale,
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

function completeIntroWithoutAnimation() {
  if (introPlayed) return;
  introPlayed = true;

  document.body.classList.remove("is-intro");
  document.body.classList.add("intro-complete");
  lockScroll(false);

  gsap.set(landingEl, { autoAlpha: 0, "--landingA": 0 });
  gsap.set(landingPlusEls, { opacity: 0, x: 0, y: 0, clearProps: "transform" });
  gsap.set([brandLogoEl, introLogoEl, logoPrintFxEl], { opacity: 0 });
  gsap.set(logoMountEl, { opacity: 1 });

  snapState = SECTION.HERO;
  setActiveSectionState(SECTION.HERO);
  settlePluses(SECTION.HERO);

  if (isMobile()) {
    mobileFrozenPlusTargets = captureCurrentPlusTargets();
  }

  bindDesktopWheelSnap();

  requestAnimationFrame(() => {
    refreshResponsiveLayout();
    showMobileSwipeHint();
  });
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

function bindServiceContactForm() {
  const forms = Array.from(document.querySelectorAll(".service-contact-form"));

  if (new URLSearchParams(window.location.search).get("contact") === "sent") {
    document.querySelectorAll("[data-contact-status]").forEach((statusEl) => {
      statusEl.hidden = false;
    });
  }

  document.querySelectorAll("[data-package-choice]").forEach((link) => {
    if (link.dataset.packageBound === "1") return;

    link.dataset.packageBound = "1";
    link.addEventListener("click", () => {
      const selectedPackage = link.dataset.packageChoice || "";
      if (!selectedPackage) return;

      const form = forms[0];
      const packageSelect = form?.querySelector('select[name="pakket"]');
      const subjectInput = form?.querySelector('input[name="_subject"]');

      if (packageSelect) {
        packageSelect.value = selectedPackage;
        packageSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }

      if (subjectInput) {
        const baseSubject = subjectInput.value.replace(/\s+-\s+.*$/, "");
        subjectInput.value = `${baseSubject} - ${selectedPackage}`;
      }
    });
  });
}

function bindPackageScroller() {
  const packageSections = Array.from(document.querySelectorAll(".service-packages"));
  if (!packageSections.length) return;

  packageSections.forEach((section) => {
    const rail = section.querySelector(".service-package-grid");
    const arrow = section.querySelector(".service-packages__arrow");
    if (!rail || !arrow || arrow.dataset.bound === "1") return;

    arrow.dataset.bound = "1";

    let scrollDirection = 1;

    const getPackages = () => Array.from(rail.querySelectorAll(".service-package"));

    const getStep = () => {
      const firstPackage = getPackages()[0];
      if (!firstPackage) return rail.clientWidth;

      const styles = window.getComputedStyle(rail);
      const gap = Number.parseFloat(styles.columnGap) || 0;
      return Math.max(1, firstPackage.getBoundingClientRect().width + gap);
    };

    const getVisibleCount = () => Math.max(1, Math.round(rail.clientWidth / getStep()));
    const getMaxIndex = () => Math.max(0, getPackages().length - getVisibleCount());
    const getCurrentIndex = () =>
      Math.min(getMaxIndex(), Math.max(0, Math.round(rail.scrollLeft / getStep())));

    const updateArrow = () => {
      const currentIndex = getCurrentIndex();
      const maxIndex = getMaxIndex();

      if (currentIndex <= 0) scrollDirection = 1;
      if (currentIndex >= maxIndex) scrollDirection = -1;

      arrow.disabled = maxIndex === 0;
      arrow.classList.toggle("is-at-end", scrollDirection < 0);
      arrow.setAttribute(
        "aria-label",
        scrollDirection < 0 ? "Bekijk vorig pakket" : "Bekijk volgend pakket",
      );
    };

    let scrollFrame = null;

    rail.addEventListener(
      "scroll",
      () => {
        if (scrollFrame) return;
        scrollFrame = window.requestAnimationFrame(() => {
          scrollFrame = null;
          updateArrow();
        });
      },
      { passive: true },
    );

    arrow.addEventListener("click", () => {
      const currentIndex = getCurrentIndex();
      const maxIndex = getMaxIndex();
      if (maxIndex === 0) return;

      if (currentIndex <= 0) scrollDirection = 1;
      if (currentIndex >= maxIndex) scrollDirection = -1;

      const targetIndex = Math.min(
        maxIndex,
        Math.max(0, currentIndex + scrollDirection),
      );

      rail.scrollTo({
        left: targetIndex * getStep(),
        behavior: "smooth",
      });
    });

    window.addEventListener("resize", updateArrow);
    updateArrow();
  });
}

function bindCaseRailScroller() {
  const caseRails = Array.from(document.querySelectorAll(".case-rail"));
  if (!caseRails.length) return;

  caseRails.forEach((section) => {
    const rail = section.querySelector(".case-grid--inline");
    const arrow = section.querySelector(".case-rail__arrow");
    if (!rail || !arrow || arrow.dataset.bound === "1") return;

    arrow.dataset.bound = "1";

    let scrollDirection = 1;

    const getCards = () => Array.from(rail.querySelectorAll(".case-card"));

    const getStep = () => {
      const firstCard = getCards()[0];
      if (!firstCard) return rail.clientWidth;

      const styles = window.getComputedStyle(rail);
      const gap = Number.parseFloat(styles.columnGap) || 0;
      return Math.max(1, firstCard.getBoundingClientRect().width + gap);
    };

    const getVisibleCount = () => Math.max(1, Math.round(rail.clientWidth / getStep()));
    const getMaxIndex = () => Math.max(0, getCards().length - getVisibleCount());
    const getCurrentIndex = () =>
      Math.min(getMaxIndex(), Math.max(0, Math.round(rail.scrollLeft / getStep())));

    const updateArrow = () => {
      const currentIndex = getCurrentIndex();
      const maxIndex = getMaxIndex();

      if (currentIndex <= 0) scrollDirection = 1;
      if (currentIndex >= maxIndex) scrollDirection = -1;

      arrow.disabled = maxIndex === 0;
      arrow.classList.toggle("is-at-end", scrollDirection < 0);
      arrow.setAttribute(
        "aria-label",
        scrollDirection < 0 ? "Bekijk vorige case" : "Bekijk volgende case",
      );
    };

    let scrollFrame = null;

    rail.addEventListener(
      "scroll",
      () => {
        if (scrollFrame) return;
        scrollFrame = window.requestAnimationFrame(() => {
          scrollFrame = null;
          updateArrow();
        });
      },
      { passive: true },
    );

    arrow.addEventListener("click", () => {
      const currentIndex = getCurrentIndex();
      const maxIndex = getMaxIndex();
      if (maxIndex === 0) return;

      if (currentIndex <= 0) scrollDirection = 1;
      if (currentIndex >= maxIndex) scrollDirection = -1;

      const targetIndex = Math.min(
        maxIndex,
        Math.max(0, currentIndex + scrollDirection),
      );

      rail.scrollTo({
        left: targetIndex * getStep(),
        behavior: "smooth",
      });
    });

    window.addEventListener("resize", updateArrow);
    updateArrow();
  });
}

function setupProjectsLazyLoader() {
  const projectsEl = getSectionElement(SECTION.PROJECTS);
  if (!projectsEl || !document.getElementById("projectsCanvas")) return;

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

function setupProjectsVideoFallback() {
  const video = document.getElementById("projectsVideo");
  const fallback = document.getElementById("projectsVideoFallback");
  const cell = video?.closest(".projects-canvas-cell");
  if (!video || !fallback || !cell) return;

  const fallbackSrc = fallback.dataset.fallbackSrc;
  const isIos =
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const canPlayVp9 =
    typeof video.canPlayType === "function" &&
    video.canPlayType('video/webm; codecs="vp9"') !== "";

  function showFallback() {
    if (fallbackSrc && fallback.getAttribute("src") !== fallbackSrc) {
      fallback.setAttribute("src", fallbackSrc);
    }
    cell.classList.add("is-video-fallback");
    cell.classList.remove("is-video-ready");
  }

  function showVideo() {
    cell.classList.add("is-video-ready");
    cell.classList.remove("is-video-fallback");
  }

  if (isIos || !canPlayVp9) {
    showFallback();
    return;
  }

  video.addEventListener("playing", showVideo, { once: true });
  video.addEventListener(
    "loadeddata",
    () => {
      if (video.readyState >= 2) showVideo();
    },
    { once: true },
  );
  video.addEventListener("error", showFallback);

  video.querySelectorAll("source").forEach((source) => {
    source.addEventListener("error", showFallback);
  });

  const playAttempt = video.play?.();
  if (playAttempt?.catch) {
    playAttempt.catch(showFallback);
  }

  window.setTimeout(() => {
    if (video.readyState < 2 || video.paused) showFallback();
  }, 2500);
}

async function boot() {
  const shouldSkipHomeIntro = hasHomeExperience && hasSeenIntro();

  if (shouldSkipHomeIntro) {
    document.body.classList.add("intro-complete");
    landingEl.style.opacity = "0";
    landingEl.style.visibility = "hidden";
    landingEl.style.pointerEvents = "none";
  }

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

  bindMobileMenu();
  bindScrollTriggers();
  bindResizeHandling();
  bindFaqAccordion();
  bindServiceOverviewModules();
  bindServiceContactForm();
  bindPackageScroller();
  bindCaseRailScroller();
  bindServiceFixedPluses();
  bindServicePlusAnimation();
  bindServiceDesktopWheelSnap();
  bindServiceMobileSwipeSnap();
  setupProjectsVideoFallback();
  setupProjectsLazyLoader();

  if (!hasHomeExperience) {
    markIntroSeen();
    document.body.classList.add("intro-complete");
    return;
  }

  bindMobileModules();
  bindMobileSwipeSnap();
  bindMobileSwipeHint();
  bindDesktopSectionSync();

  if (shouldSkipHomeIntro) {
    requestAnimationFrame(() => {
      completeIntroWithoutAnimation();
    });
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      playIntro();
    });
  });
}

boot();
