import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";
import gsap from "https://esm.sh/gsap@3.12.2";
import ScrollTrigger from "https://esm.sh/gsap@3.12.2/ScrollTrigger";
import { updateDropIndicator } from "./ui.js";

gsap.registerPlugin(ScrollTrigger);

const BREAKPOINT = 900;

const THEMES = {
  lab: { logo: "LogoGreen.png", background: 0x0a0a0a },
  hanson: { logo: "LogoBlack.png", background: 0xf6f6f4 },
  poster: { logo: "LogoBlack.png", background: 0xff6b00 },
};

const TOYS = [
  {
    badge: "DROP 01",
    title: "ProtoBoy V3",
    desc:
      "Next evolution toy. Smooth finish and attitude. Limited dropsworldwide. Made with love in Belgium. Designed by Odd Unit. Cast in resin. Hand-finished. Each piece is unique. Collect them all. Join the Odd Unit universe. Stay tuned for more drops and surprises.",
    link: "#",
  },
  {
    badge: "DROP 02",
    title: "ProtoBoy V4",
    desc: "Second form unlocked. Same vibe, new silhouette. Limited run.",
    link: "#",
  },
];

/* ─────────────────────────────────────────────────────────── */
/* DOM */
/* ─────────────────────────────────────────────────────────── */

const canvas = document.getElementById("three-canvas");
const canvasRevealEl = document.getElementById("canvasReveal");

const badgeEl = document.getElementById("badge");
const titleEl = document.getElementById("title");
const descEl = document.getElementById("desc");
const buyEl = document.getElementById("buy");

const sheetToggle = document.getElementById("sheetToggle");
const sheetTitle = document.getElementById("sheetTitle");

const landingEl = document.getElementById("landing");
const landingMarkEl = document.getElementById("landingMark");
const landingPlusEls = Array.from(document.querySelectorAll(".landing-plus"));

const brandLogoEl = document.getElementById("brandLogo");
const logoMountEl = document.getElementById("logoMount");

const logoPrintFxEl = document.getElementById("logoPrintFx");

let logoShown = false;
const mainPlusMap = {
  tl: document.querySelector(".plus--tl"),
  tr: document.querySelector(".plus--tr"),
  bl: document.querySelector(".plus--bl"),
  br: document.querySelector(".plus--br"),
};

const sceneFrameEl = document.querySelector(".scene-frame");

/* ─────────────────────────────────────────────────────────── */
/* State */
/* ─────────────────────────────────────────────────────────── */

let toy1, toy2;
let baseCamZ = 3;
let heightHint = 1.8;

let typingTween = null;
let modelsReady = false;

let mainScrollST = null;
let mainBooted = false;

let introTL = null;
let introPlayed = false;

let prevOverflowHtml = "";
let prevOverflowBody = "";

let bootReady = false;

const typedOnce = [false, false];

/* ─────────────────────────────────────────────────────────── */
/* Theme */
/* ─────────────────────────────────────────────────────────── */

function applyTheme(name, sceneRef, rendererRef) {
  const theme = THEMES[name] ?? THEMES.lab;

  document.documentElement.setAttribute("data-theme", name);
  if (brandLogoEl) brandLogoEl.src = theme.logo;
  syncLogoPrintFx();
  if (sceneRef?.background?.isColor) sceneRef.background.setHex(theme.background);
  else if (sceneRef) sceneRef.background = new THREE.Color(theme.background);

  if (rendererRef) rendererRef.setClearColor(theme.background, 1);
}

function initThemeSwitcher(sceneRef, rendererRef) {
  const select = document.getElementById("themeSelect");
  if (!select) return;

  const urlTheme = new URLSearchParams(location.search).get("theme");
  const initial = urlTheme && THEMES[urlTheme] ? urlTheme : "lab";

  select.value = initial;
  applyTheme(initial, sceneRef, rendererRef);

  select.addEventListener("change", (e) => {
    const next = e.target.value;
    applyTheme(next, sceneRef, rendererRef);

    const u = new URL(location.href);
    u.searchParams.set("theme", next);
    history.replaceState({}, "", u);

    // if intro not played yet, re-place landing geometry immediately
    handleResize();
  });
}

/* ─────────────────────────────────────────────────────────── */
/* Mobile sheet */
/* ─────────────────────────────────────────────────────────── */

function isMobile() {
  return window.matchMedia(`(max-width: ${BREAKPOINT}px)`).matches;
}

function setSheetOpen(open) {
  document.body.classList.toggle("sheet-open", open);
  sheetToggle?.setAttribute("aria-expanded", open ? "true" : "false");
}

function syncSheetMode() {
  setSheetOpen(!isMobile());
}

function syncSheetTitle(text) {
  if (!sheetTitle) return;
  sheetTitle.textContent = text || "ODD UNIT";
}

sheetToggle?.addEventListener("click", () => {
  setSheetOpen(!document.body.classList.contains("sheet-open"));
});
/* ─────────────────────────────────────────────────────────── */
/* PrintLogo */
/* ─────────────────────────────────────────────────────────── */

function syncLogoPrintFx() {
  if (!logoPrintFxEl || !brandLogoEl) return;

  const r = brandLogoEl.getBoundingClientRect();
  logoPrintFxEl.style.width = `${Math.max(1, r.width)}px`;
  logoPrintFxEl.style.height = `${Math.max(1, r.height)}px`;

  const src = brandLogoEl.currentSrc || brandLogoEl.src;
  logoPrintFxEl.style.setProperty("--logo-url", `url("${src}")`);
}
/* ─────────────────────────────────────────────────────────── */
/* Three.js */
/* ─────────────────────────────────────────────────────────── */

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;
renderer.physicallyCorrectLights = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(THEMES.lab.background);
renderer.setClearColor(THEMES.lab.background, 1);

initThemeSwitcher(scene, renderer);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 200);
scene.add(camera);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(4, 6, 4);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-5, 2, 6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.55);
rim.position.set(0, 4, -6);
scene.add(rim);

const root = new THREE.Group();
scene.add(root);

const loader = new GLTFLoader();

/* ─────────────────────────────────────────────────────────── */
/* Copy / typing */
/* ─────────────────────────────────────────────────────────── */

function setCopyStatic(idx) {
  badgeEl.textContent = TOYS[idx].badge;
  buyEl.href = TOYS[idx].link;
}

function setTextInstant(idx) {
  if (typingTween) typingTween.kill();
  titleEl.textContent = TOYS[idx].title;
  descEl.textContent = TOYS[idx].desc;
  syncSheetTitle(TOYS[idx].title);
}

function typewriteTo(titleFull, descFull, duration = 0.8) {
  titleEl.textContent = "";
  descEl.textContent = "";

  const state = { t: 0 };
  return gsap.to(state, {
    t: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      const titleCount = Math.floor(titleFull.length * state.t);
      const descCount = Math.floor(descFull.length * state.t);
      titleEl.textContent = titleFull.slice(0, titleCount);
      descEl.textContent = descFull.slice(0, descCount);
      syncSheetTitle(titleFull);
    },
  });
}

function typeSection(idx) {
  if (typingTween) typingTween.kill();
  typingTween = typewriteTo(TOYS[idx].title, TOYS[idx].desc, 0.55);
}

/* ─────────────────────────────────────────────────────────── */
/* Model prep */
/* ─────────────────────────────────────────────────────────── */

function cloneMaterials(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.material = Array.isArray(child.material)
      ? child.material.map((m) => m.clone())
      : child.material.clone();
  });
}

function groundY(model) {
  const box = new THREE.Box3().setFromObject(model);
  model.position.y -= box.min.y;
}

function prepToy(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  groundY(model);
}

function getHeight(model) {
  const box = new THREE.Box3().setFromObject(model);
  return box.getSize(new THREE.Vector3()).y;
}

function fitCameraTo(object3d, padding = 1.3, height = 1.8) {
  const box = new THREE.Box3().setFromObject(object3d);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  const fov = THREE.MathUtils.degToRad(camera.fov);
  const dist = (maxDim / 2) / Math.tan(fov / 2);

  camera.near = dist / 100;
  camera.far = dist * 100;
  camera.updateProjectionMatrix();

  camera.position.set(0, height * 0.55, dist * padding);
  camera.lookAt(0, height * 0.55, 0);
}

function setModelOpaque(model) {
  if (!model) return;
  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const apply = (m) => {
      m.opacity = 1;
      m.transparent = false;
      m.depthWrite = true;
      m.needsUpdate = true;
    };
    if (Array.isArray(child.material)) child.material.forEach(apply);
    else apply(child.material);
  });
}

function showToy(idx) {
  if (!toy1 || !toy2) return;
  toy1.visible = idx === 0;
  toy2.visible = idx === 1;
}

/* ─────────────────────────────────────────────────────────── */
/* Layout */
/* ─────────────────────────────────────────────────────────── */

function getSceneFrameCenterNdcX() {
  if (!sceneFrameEl) return 0;
  const r = sceneFrameEl.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  return (cx / window.innerWidth) * 2 - 1;
}

function worldXAtZ0FromNdcX(ndcX) {
  const p = new THREE.Vector3(ndcX, 0, 0.5).unproject(camera);
  const dir = p.sub(camera.position).normalize();
  const t = (0 - camera.position.z) / dir.z;
  return camera.position.x + dir.x * t;
}

function alignToyToSceneFrame() {
  if (isMobile()) {
    root.position.x = 0;
    return;
  }
  const ndcX = getSceneFrameCenterNdcX();
  root.position.x = worldXAtZ0FromNdcX(ndcX);
}
function updateLayout() {
  const lookY = getLookY();

  if (isMobile()) {
    root.scale.setScalar(0.72);
    root.position.x = 0;

    camera.position.z = baseCamZ * 1.22;
    camera.position.y = heightHint * 0.06;

    camera.lookAt(0, lookY, 0);
    return;
  }

  root.scale.setScalar(0.84);
  alignToyToSceneFrame();
  camera.lookAt(0, lookY, 0);
}

/* ─────────────────────────────────────────────────────────── */
/* MAIN scroll: rotate + swap */
/* ─────────────────────────────────────────────────────────── */

function cinematicCut() {
  const z0 = baseCamZ;
  gsap.killTweensOf(camera.position);
  gsap.to(camera.position, { z: z0 * 0.93, duration: 0.1, ease: "power2.out" });
  gsap.to(camera.position, { z: z0, duration: 0.16, ease: "power2.in", delay: 0.1 });
}
function getLookY() {
  return heightHint * (isMobile() ? 0.40 : 0.55);
}
function setupMainScroll() {
  if (mainScrollST) mainScrollST.kill();

  const SWAP_AT = 0.48;
  const TURNS_TOTAL = 2;

  let activeIdx = -1;
  let initialized = false;

  mainScrollST = ScrollTrigger.create({
    trigger: ".scroll-space",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
      const p = self.progress;

      root.rotation.y = p * (Math.PI * 2) * TURNS_TOTAL;

      const idx = p >= SWAP_AT ? 1 : 0;

      // ✅ first run: sync state without any "effects"
      if (!initialized) {
        initialized = true;
        activeIdx = idx;

        showToy(idx);
        setCopyStatic(idx);
        updateDropIndicator(idx);
        setModelOpaque(idx === 0 ? toy1 : toy2);
        setTextInstant(idx);

        camera.lookAt(0, getLookY(), 0);
        return;
      }

      if (idx !== activeIdx) {
        activeIdx = idx;

        showToy(idx);
        setCopyStatic(idx);
        updateDropIndicator(idx);
        setModelOpaque(idx === 0 ? toy1 : toy2);

        // ✅ no camera cut on mobile (it feels like a bug)
        if (!isMobile()) cinematicCut();

        if (!typedOnce[idx]) {
          typedOnce[idx] = true;
          typeSection(idx);
        } else {
          setTextInstant(idx);
        }
      }

      camera.lookAt(0, getLookY(), 0);
    },
  });

  mainScrollST.refresh();
  mainScrollST.update();

  return mainScrollST;
}

/* ─────────────────────────────────────────────────────────── */
/* Ticker */
/* ─────────────────────────────────────────────────────────── */

const rightTickerTrack = document.getElementById("rightTickerTrack");
const rightTickerInner = document.getElementById("rightTickerInner");

let tickerTween = null;
const tickerSpeed = 35;
let baseNodes = [];

function snapshotTickerBase() {
  if (!rightTickerInner) return;
  baseNodes = Array.from(rightTickerInner.children).map((n) => n.cloneNode(true));
}

function rebuildTicker() {
  if (!rightTickerTrack || !rightTickerInner) return;

  if (baseNodes.length === 0) snapshotTickerBase();
  if (baseNodes.length === 0) return;

  if (tickerTween) tickerTween.kill();
  gsap.set(rightTickerTrack, { clearProps: "transform" });

  rightTickerTrack.querySelectorAll(".right-ticker__clone").forEach((n) => n.remove());

  rightTickerInner.innerHTML = "";
  baseNodes.forEach((n) => rightTickerInner.appendChild(n.cloneNode(true)));

  let guard = 0;
  while (rightTickerInner.getBoundingClientRect().height < window.innerHeight + 300 && guard < 60) {
    baseNodes.forEach((n) => rightTickerInner.appendChild(n.cloneNode(true)));
    guard++;
  }

  const groupH = rightTickerInner.getBoundingClientRect().height;
  if (groupH <= 0) return;

  const clone = rightTickerInner.cloneNode(true);
  clone.classList.add("right-ticker__clone");
  clone.removeAttribute("id");
  clone.setAttribute("aria-hidden", "true");
  rightTickerTrack.appendChild(clone);

  gsap.set(rightTickerTrack, { y: -groupH });
  tickerTween = gsap.to(rightTickerTrack, {
    y: 0,
    duration: groupH / tickerSpeed,
    ease: "none",
    repeat: -1,
  });
}

function startTicker() {
  if (!rightTickerTrack) return;
  if (document.fonts?.ready) document.fonts.ready.then(rebuildTicker);
  else rebuildTicker();
}

/* ─────────────────────────────────────────────────────────── */
/* Landing intro helpers */
/* ─────────────────────────────────────────────────────────── */

function lockScroll(lock) {
  const sbw = window.innerWidth - document.documentElement.clientWidth;

  if (lock) {
    prevOverflowHtml = document.documentElement.style.overflow;
    prevOverflowBody = document.body.style.overflow;

    // compensate for scrollbar removal
    document.documentElement.style.paddingRight = `${sbw}px`;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return;
  }

  document.documentElement.style.overflow = prevOverflowHtml || "";
  document.body.style.overflow = prevOverflowBody || "";

  // remove compensation
  document.documentElement.style.paddingRight = "";

  window.scrollTo(0, 0);
}

function resetLandingStates() {
  document.body.classList.remove("intro-done");

  gsap.set("#landing", { autoAlpha: 1 });
  landingEl?.setAttribute("aria-hidden", "false");

  gsap.set(".scene-frame", { opacity: 0 });
  gsap.set(".scene-frame .plus", { opacity: 0 });
  gsap.set(".ui-panel", { opacity: 0, y: 14 });
  gsap.set(".right-ticker", { opacity: 0 });
  gsap.set("header.topbar nav", { opacity: 0 });
  gsap.set("#themeSelect", { opacity: 0 }); 

  gsap.set(canvasRevealEl, { opacity: 1 });
gsap.set(logoPrintFxEl, { opacity: 0, "--py": 0, "--hx": 0, clearProps: "transform" });  // stay hidden until bootReady places them
  gsap.set(landingPlusEls, { opacity: 0, clearProps: "transform" });
  gsap.set(brandLogoEl, { opacity: 0 });

  logoShown = false;
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

function dockLogo() {
  if (!brandLogoEl || !logoMountEl) return;
  logoMountEl.appendChild(brandLogoEl);
  brandLogoEl.classList.remove("logo-float");
  gsap.set(brandLogoEl, { clearProps: "transform", opacity: 1 });
}

/* ─────────────────────────────────────────────────────────── */
/* Intro start orchestration (THIS is the fix) */
/* ─────────────────────────────────────────────────────────── */

function maybeStartIntro() {
  if (introPlayed) return;
  if (!bootReady) return;
  if (!modelsReady) return;

  // start next frame so layout is final
  requestAnimationFrame(() => requestAnimationFrame(playLandingIntro));
}

function playLandingIntro() {
  if (introPlayed || !bootReady || !modelsReady) return;
  introPlayed = true;

  if (introTL) {
    introTL.kill();
    introTL = null;
  }

  lockScroll(true);
  resetLandingStates();
  syncLogoRatioAndMountWidth();
  syncLogoPrintFx();

  // ensure real logo is floating in body during intro
  if (brandLogoEl && !brandLogoEl.classList.contains("logo-float")) {
    document.body.appendChild(brandLogoEl);
    brandLogoEl.classList.add("logo-float");
  }

  // ensure print fx exists in body
  if (logoPrintFxEl && !document.body.contains(logoPrintFxEl)) {
    document.body.appendChild(logoPrintFxEl);
  }
  logoPrintFxEl.classList.add("logo-float");

  const mountRect = logoMountEl.getBoundingClientRect();
  const landingRect = landingMarkEl.getBoundingClientRect();

  // reset before measuring
  gsap.set(brandLogoEl, { x: 0, y: 0, scale: 1, clearProps: "transform" });
  const baseRect = brandLogoEl.getBoundingClientRect();

  const endX = mountRect.left;
  const endY = mountRect.top;

  const startScale = landingRect.width / Math.max(1, baseRect.width);
  const startX = landingRect.left;
  const startY = landingRect.top;

  // hide real logo until docking
  gsap.set(brandLogoEl, { opacity: 0 });

  // show landing pluses
  gsap.set(landingPlusEls, { opacity: 0.95 });

  // position print fx at landing
  gsap.set(logoPrintFxEl, {
    opacity: 1,
    x: startX,
    y: startY,
    scale: startScale,
    transformOrigin: "top left",
    "--py": 0, // how much of the logo height the landing geometry covers (0-1)
    "--hx": 0,
  });

  // print config
  const LAYERS = 4; 
  const TIME_PER_LAYER = 0.6; 
  const PRINT_DUR = LAYERS * TIME_PER_LAYER;     // total print time
  const MOVE_DUR = 1.4;

  // IMPORTANT: set band thickness as % so math never goes negative
  logoPrintFxEl.style.setProperty("--layerH", `${100 / LAYERS}%`);

  const MOVE_START = PRINT_DUR;
  const XFADE = MOVE_START + Math.max(0, MOVE_DUR - 0.12);

  const printState = { t: 0 };

  introTL = gsap.timeline({
    onComplete: () => {
      document.body.classList.add("intro-done");

      gsap.set("#landing", { autoAlpha: 0 });
      landingEl?.setAttribute("aria-hidden", "true");

      gsap.set(logoPrintFxEl, { opacity: 0 });
      dockLogo();

      lockScroll(false);

      if (mainScrollST) {
        mainScrollST.enable();
        mainScrollST.update();
      }

      if (!mainBooted) {
        mainBooted = true;
        typeSection(0);
        typedOnce[0] = true;
        startTicker();
      }

      ScrollTrigger.refresh();
    },
  });

  // PRINT: bottom->top, each layer scans left->right
  introTL.to(printState, {
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

      // current layer height is fixed until layer completes
      const py = (layerIdx + 1) / LAYERS;
      const hx = frac; // left->right scan within layer

      logoPrintFxEl.style.setProperty("--py", py.toFixed(4));
      logoPrintFxEl.style.setProperty("--hx", hx.toFixed(4));
    },
  }, 0);

  // MOVE to topbar
  introTL.to(
    logoPrintFxEl,
    { x: endX, y: endY, scale: 1, duration: MOVE_DUR, ease: "power2.inOut" },
    MOVE_START
  );

  // move landing pluses to scene-frame pluses
  landingPlusEls.forEach((p) => {
    const corner = p.getAttribute("data-corner");
    const target = mainPlusMap[corner];
    if (!target) return;

    const a = p.getBoundingClientRect();
    const b = target.getBoundingClientRect();

    introTL.to(
      p,
      { x: b.left - a.left, y: b.top - a.top, duration: MOVE_DUR, ease: "power2.inOut" },
      MOVE_START
    );
  });

  // UI fade-in + canvas reveal
  introTL.to(".scene-frame", { opacity: 1, duration: 0.25, ease: "power1.out" }, MOVE_START + 0.24);
  introTL.to(".ui-panel", { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, MOVE_START + 0.28);
  introTL.to(".right-ticker", { opacity: 1, duration: 0.25, ease: "power1.out" }, MOVE_START + 0.34);
  introTL.to("header.topbar nav", { opacity: 1, duration: 0.25, ease: "power1.out" }, MOVE_START + 0.32);
  introTL.to("#themeSelect", { opacity: 1, duration: 0.25, ease: "power1.out" }, MOVE_START + 0.32);

  introTL.to(canvasRevealEl, { opacity: 0, duration: 0.35, ease: "power1.out" }, MOVE_START + 0.28);

  // crossfade plus sets
  introTL.to(landingPlusEls, { opacity: 0, duration: 0.18, ease: "none" }, XFADE);
  introTL.to(".scene-frame .plus", { opacity: 1, duration: 0.18, ease: "none" }, XFADE);

  introTL.set("#landing", { autoAlpha: 0 }, MOVE_START + 1.15);
}

/* ─────────────────────────────────────────────────────────── */
/* Resize */
/* ─────────────────────────────────────────────────────────── */
function resizeToCanvas() {
  const r = canvas.getBoundingClientRect();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(r.width, r.height, false); // false = don't touch CSS size

  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
}
resizeToCanvas();
function handleResize() {
  syncSheetMode();

  resizeToCanvas();

  if (modelsReady) updateLayout();

  syncLogoRatioAndMountWidth();
  syncLogoPrintFx();
  // if (!introPlayed) {
  //   // your existing pre-intro positioning...
  // }

  ScrollTrigger.refresh();
}

window.addEventListener("resize", handleResize);


/* ─────────────────────────────────────────────────────────── */
/* Boot: landing geometry FIRST */
/* ─────────────────────────────────────────────────────────── */

(async function prepareLanding() {
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
  maybeStartIntro(); // ✅ important: retry start
})();

/* ─────────────────────────────────────────────────────────── */
/* Boot: models */
/* ─────────────────────────────────────────────────────────── */

setCopyStatic(0);
syncSheetMode();

Promise.all([loader.loadAsync("./toy1.glb"), loader.loadAsync("./toy2.glb")]).then(([g1, g2]) => {
  toy1 = g1.scene;
  toy2 = g2.scene;

  cloneMaterials(toy1);
  cloneMaterials(toy2);

  prepToy(toy1);
  prepToy(toy2);

  const h1 = getHeight(toy1);
  const h2 = getHeight(toy2);
  heightHint = h1 > 0 ? h1 : 1.8;

  if (h2 > 0 && h1 > 0) {
    toy2.scale.multiplyScalar(h1 / h2);
    groundY(toy2);
  }

  root.add(toy1);
  root.add(toy2);

  fitCameraTo(root, 1.35, heightHint);
  baseCamZ = camera.position.z;

  showToy(0);
  setCopyStatic(0);
  updateDropIndicator(0);

  setModelOpaque(toy1);
  setModelOpaque(toy2);

  modelsReady = true;

  setupMainScroll();
  mainScrollST.disable();

  handleResize();
  maybeStartIntro(); // ✅ important: retry start
});

/* ─────────────────────────────────────────────────────────── */
/* Render loop */
/* ─────────────────────────────────────────────────────────── */

function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

