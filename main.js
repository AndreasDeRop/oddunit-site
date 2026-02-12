import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";
import gsap from "https://esm.sh/gsap@3.12.2";
import ScrollTrigger from "https://esm.sh/gsap@3.12.2/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("three-canvas");

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7; // stop blowing highlights
renderer.physicallyCorrectLights = false;

// --- Scene / Camera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0b);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 200);
scene.add(camera);

// --- Environment reflections ---
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// --- Lights (kept sane) ---
const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(4, 6, 4);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-5, 2, 6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.55);
rim.position.set(0, 4, -6);
scene.add(rim);

// --- Root group (rotate this) ---
const root = new THREE.Group();
scene.add(root);

const loader = new GLTFLoader();

let toy1, toy2;
let baseCamZ = 3;
let heightHint = 1.8;

Promise.all([
  loader.loadAsync("./toy1.glb"),
  loader.loadAsync("./toy2.glb"),
]).then(([g1, g2]) => {
  toy1 = g1.scene;
  toy2 = g2.scene;

  // clone materials so each toy is independent
  cloneMaterials(toy1);
  cloneMaterials(toy2);

  // normalize transforms
  prepToy(toy1);
  prepToy(toy2);

  // scale toy2 to match toy1 height
  const h1 = getHeight(toy1);
  const h2 = getHeight(toy2);
  heightHint = h1 > 0 ? h1 : 1.8;

  if (h2 > 0 && h1 > 0) {
    toy2.scale.multiplyScalar(h1 / h2);
    groundY(toy2);
  }

  root.add(toy1);
  root.add(toy2);

  // fit camera to BOTH
  fitCameraTo(root, camera, 1.35, heightHint);
  baseCamZ = camera.position.z;

  setupScroll();
  updateLayout();
  window.addEventListener("resize", updateLayout);
  
  function updateLayout() {
    const isMobile = window.innerWidth <= 900;
    if (isMobile) {
      root.position.x = 0;
      camera.position.z = baseCamZ;
      return;
    }
  
    // push toy left based on reserved panel width
    const panelW = Math.min(Math.max(window.innerWidth * 0.34, 320), 520); // same as CSS clamp
    const panelFrac = panelW / window.innerWidth; // 0..1
  
    // tuned shift: more panel => more left
    root.position.x = -(0.25 + panelFrac * 1.0);
  }
});

// ---------- Helpers ----------
function cloneMaterials(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((m) => m.clone());
    } else {
      child.material = child.material.clone();
    }
  });
}

function prepToy(model) {
  // center X/Z
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;

  // ground feet
  groundY(model);
}

function groundY(model) {
  const box = new THREE.Box3().setFromObject(model);
  model.position.y -= box.min.y;
}

function getHeight(model) {
  const box = new THREE.Box3().setFromObject(model);
  return box.getSize(new THREE.Vector3()).y;
}

function fitCameraTo(object3d, camera, padding = 1.3, height = 1.8) {
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

// ---------- Scroll animation ----------
function setupScroll() {
  const badgeEl = document.getElementById("badge");
  const titleEl = document.getElementById("title");
  const descEl  = document.getElementById("desc");
  const buyEl   = document.getElementById("buy");

  const TOYS = [
    {
      badge: "DROP 01",
      title: "ProtoBoy V3",
      desc:  "Next evolution toy. Smooth finish and attitude. Limited drops worldwide.",
      link:  "#"
    },
    {
      badge: "DROP 02",
      title: "ProtoBoy V4",
      desc:  "Second form unlocked. Same vibe, new silhouette. Limited run.",
      link:  "#"
    }
  ];

  function setCopy(idx) {
    badgeEl.textContent = TOYS[idx].badge;
    titleEl.textContent = TOYS[idx].title;
    descEl.textContent  = TOYS[idx].desc;
    buyEl.href          = TOYS[idx].link;

    // tiny “cinematic” UI pop
    gsap.fromTo(
      document.getElementById("copy"),
      { y: 8, opacity: 0.85 },
      { y: 0, opacity: 1, duration: 0.18, ease: "power2.out" }
    );
  }

  // initial
  toy1.visible = true;
  toy2.visible = false;
  setCopy(0);

  let swapped = false;

  const TURNS_TOTAL = 2;
  const swapAt = 0.47;

  function cinematicCut() {
    const z0 = baseCamZ;

    gsap.killTweensOf(camera.position);
    gsap.to(camera.position, { z: z0 * 0.93, duration: 0.10, ease: "power2.out" });
    gsap.to(camera.position, { z: z0, duration: 0.16, ease: "power2.in", delay: 0.10 });

    gsap.killTweensOf(scene.background);
    gsap.to(scene.background, {
      r: 0.0, g: 0.0, b: 0.0,
      duration: 0.06,
      yoyo: true,
      repeat: 1
    });
  }

  function showToy1() {
    toy1.visible = true;
    toy2.visible = false;
    setCopy(0);
  }

  function showToy2() {
    toy1.visible = false;
    toy2.visible = true;
    setCopy(1);
  }

  ScrollTrigger.create({
    trigger: ".scroll-space",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
      const p = self.progress;

      root.rotation.y = p * (Math.PI * 2) * TURNS_TOTAL;

      if (!swapped && p >= swapAt) {
        swapped = true;
        showToy2();
        cinematicCut();
      }

      if (swapped && p < swapAt) {
        swapped = false;
        showToy1();
        cinematicCut();
      }

      camera.lookAt(0, heightHint * 0.55, 0);
    }
  });
}




// ---------- Render loop ----------
function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// ---------- Resize ----------
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
