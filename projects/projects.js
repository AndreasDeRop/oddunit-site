import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "https://esm.sh/three@0.160.0/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";
import gsap from "https://esm.sh/gsap@3.12.2";

const BREAKPOINT = 900;
const DESKTOP_PIXEL_RATIO = 1.25;
const ASSET_VERSION = "20260506-project-layout";
const INITIAL_MODEL_ROTATION = 0;
const MODEL_CAMERA_PADDING = 1.25;
const MODEL_SCALE_DESKTOP = 0.9;
const MODEL_SCALE_MOBILE = 1;
const IDLE_ROTATION_SPEED = (Math.PI * 2) / 22;
const IDLE_ROTATION_FPS = 24;
const IDLE_ROTATION_START_DELAY = 900;

const DROPS = [
  {
    badge: "DROP 01",
    title: "FONS",
    desc:
      "Dit is Fons. Fons heeft net een dikke karper gevangen, azo een klet péken! Wil je graag jouw eigen Fons? Goed nieuws! Wij brengen hem binnenkort uit als onze eerste resin Art Toy, handgemaakt in ons atelier.",
    link: "#",
    available: false,
    ctaLabel: "COMING SOON",
    model: `./projects/toy1.glb?v=${ASSET_VERSION}`,
  }
];

const HAS_MULTIPLE_DROPS = DROPS.length > 1;

const canvas = document.getElementById("projectsCanvas");
const canvasCell = document.querySelector(".projects-canvas-cell");
const projectsSection = document.getElementById("projects");

if (canvas && canvasCell && projectsSection) {
  initProjectsScene();
}

function initProjectsScene() {
  const nextBtn = document.getElementById("projectNextBtn");
  const badgeEl = document.getElementById("projectBadge");
  const editionEl = document.getElementById("projectEdition");
  const titleEl = document.getElementById("projectTitle");
  const descEl = document.getElementById("projectDesc");
  const buyEl = document.getElementById("projectBuy");
  const dotsEl = document.getElementById("projectDots");
  const dotEls = Array.from(document.querySelectorAll(".projects-dot"));

  const tickerTrack = document.getElementById("projectsTickerTrack");
  const tickerInner = document.getElementById("projectsTickerInner");

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, DESKTOP_PIXEL_RATIO));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(4, 6, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-5, 2, 6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.55);
  rim.position.set(0, 4, -6);
  scene.add(rim);

  const root = new THREE.Group();
  root.rotation.y = INITIAL_MODEL_ROTATION;
  scene.add(root);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  let toy1 = null;
  let toy2 = null;
  let activeIdx = 0;
  let baseCamZ = 3;
  let heightHint = 1.8;

  let typingTween = null;
  let tickerTween = null;
  let visibilityObserver = null;

  let renderQueued = false;
  let sceneVisible = false;
  let idleRotationRaf = 0;
  let idleRotationDelayTimer = 0;
  let lastIdleRotationTs = 0;
  let baseTickerNodes = [];
  let resizeTimer = 0;

  const typedOnce = [false, false];

  function isMobile() {
    return window.matchMedia(`(max-width: ${BREAKPOINT}px)`).matches;
  }

  syncProjectControls();

  if (nextBtn && HAS_MULTIPLE_DROPS && nextBtn.dataset.bound !== "1") {
    nextBtn.dataset.bound = "1";
    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToNextProject();
    });
  }

  function syncProjectControls() {
    if (nextBtn) {
      nextBtn.hidden = !HAS_MULTIPLE_DROPS;
      nextBtn.disabled = !HAS_MULTIPLE_DROPS;
      nextBtn.setAttribute("aria-hidden", String(!HAS_MULTIPLE_DROPS));
    }

    if (dotsEl) {
      dotsEl.hidden = !HAS_MULTIPLE_DROPS;
      dotsEl.setAttribute("aria-hidden", String(!HAS_MULTIPLE_DROPS));
    }

    dotEls.forEach((dot, index) => {
      const enabled = HAS_MULTIPLE_DROPS && index < DROPS.length;

      dot.hidden = !enabled;
      dot.disabled = !enabled;
      dot.setAttribute("aria-hidden", String(!enabled));
    });
  }

  function requestRender() {
    if (renderQueued) return;

    renderQueued = true;

    requestAnimationFrame(() => {
      renderQueued = false;
      renderer.render(scene, camera);
    });
  }

  function stopIdleRotation() {
    if (idleRotationDelayTimer) {
      window.clearTimeout(idleRotationDelayTimer);
      idleRotationDelayTimer = 0;
    }

    if (!idleRotationRaf) return;

    cancelAnimationFrame(idleRotationRaf);
    idleRotationRaf = 0;
    lastIdleRotationTs = 0;
  }

  function idleRotationTick(ts) {
    if (!sceneVisible || !toy1) {
      stopIdleRotation();
      return;
    }

    if (!lastIdleRotationTs) {
      lastIdleRotationTs = ts;
    }

    const elapsed = ts - lastIdleRotationTs;
    const minFrameTime = 1000 / IDLE_ROTATION_FPS;

    if (elapsed >= minFrameTime) {
      root.rotation.y += IDLE_ROTATION_SPEED * (elapsed / 1000);
      lastIdleRotationTs = ts;
      renderer.render(scene, camera);
    }

    idleRotationRaf = requestAnimationFrame(idleRotationTick);
  }

  function startIdleRotation(delay = 0) {
    if (idleRotationRaf || idleRotationDelayTimer || !sceneVisible || !toy1) {
      return;
    }

    if (delay > 0) {
      idleRotationDelayTimer = window.setTimeout(() => {
        idleRotationDelayTimer = 0;
        startIdleRotation();
      }, delay);

      return;
    }

    lastIdleRotationTs = 0;
    idleRotationRaf = requestAnimationFrame(idleRotationTick);
  }

  function updateDots(idx) {
    dotEls.forEach((dot, i) => {
      if (i >= DROPS.length) return;
      dot.classList.toggle("is-active", i === idx);
    });
  }

  function setCopyStatic(idx) {
    const item = DROPS[idx];
    badgeEl.textContent = item.badge;

    const editionItem = editionEl?.closest(".projects-meta-item");
    if (editionEl && editionItem) {
      const hasEdition = Boolean(item.edition);
      editionEl.textContent = item.edition || "";
      editionItem.hidden = !hasEdition;
    }

    if (buyEl) {
      const isAvailable = item.available !== false;

      buyEl.textContent =
        item.ctaLabel || (isAvailable ? "KOOP NU" : "BINNENKORT");
      buyEl.classList.toggle("is-disabled", !isAvailable);
      buyEl.setAttribute("aria-disabled", String(!isAvailable));

      if (isAvailable) {
        buyEl.href = item.link;
        buyEl.tabIndex = 0;
      } else {
        buyEl.removeAttribute("href");
        buyEl.tabIndex = -1;
      }
    }
  }

  function setTextInstant(idx) {
    const item = DROPS[idx];
    titleEl.textContent = item.title;
    descEl.textContent = item.desc;
  }

  function typewriteTo(title, desc, duration = 0.55) {
    if (typingTween) {
      typingTween.kill();
      typingTween = null;
    }

    titleEl.textContent = "";
    descEl.textContent = "";

    const state = { t: 0 };

    typingTween = gsap.to(state, {
      t: 1,
      duration,
      ease: "none",
      onUpdate: () => {
        const titleCount = Math.floor(title.length * state.t);
        const descCount = Math.floor(desc.length * state.t);

        titleEl.textContent = title.slice(0, titleCount);
        descEl.textContent = desc.slice(0, descCount);
      },
      onComplete: () => {
        typingTween = null;
      },
    });
  }

  function renderCopy(idx, useTyping = false) {
    setCopyStatic(idx);

    if (useTyping) {
      typewriteTo(DROPS[idx].title, DROPS[idx].desc);
      return;
    }

    setTextInstant(idx);
  }

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

  function fitCameraTo(object3d, padding = 1.35, height = 1.8) {
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

      const apply = (material) => {
        material.opacity = 1;
        material.transparent = false;
        material.depthWrite = true;
        material.needsUpdate = true;
      };

      if (Array.isArray(child.material)) {
        child.material.forEach(apply);
      } else {
        apply(child.material);
      }
    });
  }

  function showToy(idx) {
    if (!toy1) return;

    toy1.visible = idx === 0;

    if (toy2) {
      toy2.visible = idx === 1;
    }
  }

  function setActiveProject(idx, useTyping = false) {
    if (!toy1) return;
    if (idx === 1 && !toy2) return;

    activeIdx = idx;
    showToy(idx);
    setModelOpaque(idx === 0 ? toy1 : toy2);
    updateDots(idx);
    renderCopy(idx, useTyping);
    requestRender();
  }

  function resizeRenderer() {
    const rect = canvasCell.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function getLookY() {
    return heightHint * (isMobile() ? 0.42 : 0.55);
  }

  function updateLayout() {
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, isMobile() ? 1 : DESKTOP_PIXEL_RATIO),
    );
    resizeRenderer();

    if (!toy1) {
      requestRender();
      return;
    }

    root.scale.setScalar(isMobile() ? MODEL_SCALE_MOBILE : MODEL_SCALE_DESKTOP);
    camera.position.z = isMobile() ? baseCamZ * 1.02 : baseCamZ;
    camera.position.y = isMobile() ? heightHint * 0.08 : heightHint * 0.55;
    camera.lookAt(0, getLookY(), 0);

    requestRender();
  }

  function snapshotTickerBase() {
    if (!tickerInner) return;
    baseTickerNodes = Array.from(tickerInner.children).map((node) => node.cloneNode(true));
  }

  function rebuildTicker() {
    if (!tickerTrack || !tickerInner || isMobile()) {
      if (tickerTween) {
        tickerTween.kill();
        tickerTween = null;
      }

      if (tickerTrack) {
        gsap.set(tickerTrack, { clearProps: "transform" });
        tickerTrack
          .querySelectorAll(".projects-ticker__clone")
          .forEach((node) => node.remove());
      }

      return;
    }

    if (baseTickerNodes.length === 0) snapshotTickerBase();
    if (baseTickerNodes.length === 0) return;

    if (tickerTween) {
      tickerTween.kill();
      tickerTween = null;
    }

    gsap.set(tickerTrack, { clearProps: "transform" });

    tickerTrack.querySelectorAll(".projects-ticker__clone").forEach((node) => {
      node.remove();
    });

    tickerInner.innerHTML = "";
    baseTickerNodes.forEach((node) => {
      tickerInner.appendChild(node.cloneNode(true));
    });

    let guard = 0;

    while (
      tickerInner.getBoundingClientRect().width <
        tickerTrack.getBoundingClientRect().width + 300 &&
      guard < 50
    ) {
      baseTickerNodes.forEach((node) => {
        tickerInner.appendChild(node.cloneNode(true));
      });
      guard += 1;
    }

    const groupWidth = tickerInner.getBoundingClientRect().width;
    if (groupWidth <= 0) return;

    const clone = tickerInner.cloneNode(true);
    clone.classList.add("projects-ticker__clone");
    clone.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    tickerTrack.appendChild(clone);

    gsap.set(tickerTrack, { x: 0 });

    tickerTween = gsap.to(tickerTrack, {
      x: -groupWidth,
      duration: groupWidth / 35,
      ease: "none",
      repeat: -1,
    });
  }

  function syncProjectsMode() {
    gsap.killTweensOf(root.rotation);
    requestRender();
    startIdleRotation();
  }

  function goToNextProject() {
    if (!HAS_MULTIPLE_DROPS || !toy2) return;

    const nextIdx = (activeIdx + 1) % DROPS.length;

    setActiveProject(nextIdx, true);

    stopIdleRotation();
    gsap.killTweensOf(root.rotation);

    gsap.to(root.rotation, {
      y: root.rotation.y + Math.PI * 0.9,
      duration: 0.6,
      ease: "power2.out",
      overwrite: true,
      onUpdate: requestRender,
      onComplete: () => {
        startIdleRotation();
        requestRender();
      },
    });
  }

  function setupSceneVisibility() {
    if (visibilityObserver) {
      visibilityObserver.disconnect();
    }

    visibilityObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting;
        sceneVisible = Boolean(visible);

        if (visible) {
          if (activeIdx === 0) {
            root.rotation.y = INITIAL_MODEL_ROTATION;
          }

          requestRender();
          startIdleRotation(IDLE_ROTATION_START_DELAY);
        } else {
          stopIdleRotation();
        }
      },
      { threshold: 0.2 },
    );

    visibilityObserver.observe(projectsSection);
  }

  function scheduleRefresh(delay = 140) {
    clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(() => {
      updateLayout();
      syncProjectsMode();
      rebuildTicker();
      requestRender();
    }, delay);
  }

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          scheduleRefresh(100);
        })
      : null;

  if (resizeObserver) {
    resizeObserver.observe(canvasCell);
  }

  window.addEventListener("resize", () => scheduleRefresh(120));
  window.addEventListener("orientationchange", () => scheduleRefresh(220));

  loader.loadAsync(DROPS[0].model).then((g1) => {
    toy1 = g1.scene;

    cloneMaterials(toy1);
    prepToy(toy1);

    const h1 = getHeight(toy1);
    heightHint = h1 > 0 ? h1 : 1.8;

    root.add(toy1);
    fitCameraTo(toy1, MODEL_CAMERA_PADDING, heightHint);
    baseCamZ = camera.position.z;

    activeIdx = 0;
    showToy(0);
    setModelOpaque(toy1);

    renderCopy(0, false);
    updateDots(0);
    typedOnce[0] = true;
    updateLayout();
    syncProjectsMode();
    setupSceneVisibility();
    rebuildTicker();
    requestRender();

    if (!HAS_MULTIPLE_DROPS) return;

    loader.loadAsync(DROPS[1].model).then((g2) => {
      toy2 = g2.scene;

      cloneMaterials(toy2);
      prepToy(toy2);

      const h2 = getHeight(toy2);
      if (h1 > 0 && h2 > 0) {
        toy2.scale.multiplyScalar(h1 / h2);
        groundY(toy2);
      }

      toy2.visible = activeIdx === 1;
      root.add(toy2);
      setModelOpaque(toy2);
      updateLayout();
      requestRender();
    });
  });
}
