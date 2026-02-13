import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";
import gsap from "https://esm.sh/gsap@3.12.2";
import ScrollTrigger from "https://esm.sh/gsap@3.12.2/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("three-canvas");

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;
renderer.physicallyCorrectLights = false;
const copyParallaxEl = document.getElementById("copyParallax");

// Scene / Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0b);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 200);
scene.add(camera);

// Env
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// Lights
const key = new THREE.DirectionalLight(0xffffff, 1.2);
key.position.set(4, 6, 4);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-5, 2, 6);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.55);
rim.position.set(0, 4, -6);
scene.add(rim);

// Root
const root = new THREE.Group();
scene.add(root);

const loader = new GLTFLoader();

let toy1, toy2;
let baseCamZ = 3;
let heightHint = 1.8;

const TOYS = [
  { badge:"DROP 01", title:"ProtoBoy V3", desc:"Next evolution toy. Smooth finish and attitude. Limited drops worldwide.", link:"#"},
  { badge:"DROP 02", title:"ProtoBoy V4", desc:"Second form unlocked. Same vibe, new silhouette. Limited run.", link:"#"}
];

const badgeEl = document.getElementById("badge");
const titleEl = document.getElementById("title");
const descEl  = document.getElementById("desc");
const buyEl   = document.getElementById("buy");
const copyEl  = document.getElementById("copy");

function setCopy(idx){
  badgeEl.textContent = TOYS[idx].badge;
  titleEl.textContent = TOYS[idx].title;
  descEl.textContent  = TOYS[idx].desc;
  buyEl.href          = TOYS[idx].link;

  gsap.killTweensOf(copyEl);

  gsap.fromTo(copyEl, { y: 10 }, { y: 0, duration: 0.18, ease: "power2.out" });
}

// show something immediately (preload)
setCopy(0);

function showToy(idx) {
  toy1.visible = idx === 0;
  toy2.visible = idx === 1;
}

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

Promise.all([
  loader.loadAsync("./toy1.glb"),
  loader.loadAsync("./toy2.glb")
]).then(([g1, g2]) => {
  toy1 = g1.scene;
  toy2 = g2.scene;

  cloneMaterials(toy1);
  cloneMaterials(toy2);

  prepToy(toy1);
  prepToy(toy2);

  // match heights
  const h1 = getHeight(toy1);
  const h2 = getHeight(toy2);
  heightHint = h1 > 0 ? h1 : 1.8;

  if (h2 > 0 && h1 > 0) {
    toy2.scale.multiplyScalar(h1 / h2);
    groundY(toy2);
  }

  root.add(toy1);
  root.add(toy2);

  fitCameraTo(root, camera, 1.35, heightHint);
  baseCamZ = camera.position.z;

  // initial
  showToy(0);
  setCopy(0);

  updateLayout();
  setupScroll();

  window.addEventListener("resize", () => {
    updateLayout();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    ScrollTrigger.refresh();
  });
});

function cloneMaterials(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.material = Array.isArray(child.material)
      ? child.material.map((m) => m.clone())
      : child.material.clone();
  });
}

function prepToy(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
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

function updateLayout() {
  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    root.position.x = 0;
    camera.position.z = baseCamZ;
    return;
  }

  const panelW = Math.min(Math.max(window.innerWidth * 0.34, 320), 520);
  const panelFrac = panelW / window.innerWidth;
  root.position.x = -(0.25 + panelFrac * 1.0);
}

function setupScroll() {
  // kill any previous triggers (important if you reload/hot refresh)
  ScrollTrigger.getAll().forEach((t) => t.kill());

  const swapAt = 0.48;
  const TURNS_TOTAL = 2;

  // how much the text drifts within EACH toy section
  const PARALLAX_RANGE = 240;

  // fast setter (no tween fighting)
  const setParallaxY = gsap.quickSetter(copyParallaxEl, "y", "px");

  let activeIdx = 0;

  // start centered
  setParallaxY(0);

  ScrollTrigger.create({
    trigger: ".scroll-space",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
      const p = self.progress;

      // character rotation stays continuous
      root.rotation.y = p * (Math.PI * 2) * TURNS_TOTAL;

      // which toy is active
      const idx = p >= swapAt ? 1 : 0;

      // compute progress INSIDE the current segment (0..1)
      const segP = idx === 0
        ? (swapAt === 0 ? 0 : p / swapAt)
        : ((1 - swapAt) === 0 ? 0 : (p - swapAt) / (1 - swapAt));

      // ✅ this recenters at the start of each toy section
      setParallaxY(-PARALLAX_RANGE * segP);

      // swap toy + text exactly at threshold
      if (idx !== activeIdx) {
        activeIdx = idx;

        // reset parallax so the new text starts centered immediately
        setParallaxY(0);

        showToy(idx);
        setCopy(idx);
        cinematicCut();
      }

      camera.lookAt(0, heightHint * 0.55, 0);
    }
  });
}


// Render loop
function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
