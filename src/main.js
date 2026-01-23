// src/main.js
import scene from "./core/scene.js";
import camera from "./core/camera.js";
import renderer from "./core/renderer.js";
import { setupResize } from "./utils/resize.js";
import { createStadium } from "./world/stadium.js";
import { createCity } from "./world/city.js";

import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";

// =========================
// BASE LIGHTS (kontrollohen me N)
// =========================
const ambient = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(5, 14, 8);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
scene.add(dir);

let isNight = false;

// =========================
// Cached references (PERFORMANCE)
// =========================
let stadiumRef = null;
let scoreboardRef = null;

// =========================
// Background colors (reuse – mos krijo çdo herë)
// =========================
const DAY_FALLBACK = new THREE.Color(0x87b7ff);
const NIGHT_BG = new THREE.Color(0x05070d);

// =========================
// HDRI (Day)
// =========================
scene.background = DAY_FALLBACK;

let dayHDRI = null;

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

new EXRLoader().load("/hdri/day.exr", (tex) => {
  tex.mapping = THREE.EquirectangularReflectionMapping;

  const envMap = pmrem.fromEquirectangular(tex).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.35;

  dayHDRI = tex;
  scene.background = tex;

  pmrem.dispose();

  // nëse je në night kur u load HDRI
  applyNightDay();
});

// =========================
// Sky Dome (mbyll botën)
// =========================
const skyGeo = new THREE.SphereGeometry(800, 32, 16);
const skyMat = new THREE.MeshBasicMaterial({
  color: 0x9fd3ff,
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.10,
});
scene.add(new THREE.Mesh(skyGeo, skyMat));

// =========================
// Controls
// =========================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 15;
controls.maxDistance = 200;
controls.minPolarAngle = Math.PI * 0.08;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 5, 0);
controls.update();

setupResize(camera, renderer);

// =========================
// Raycaster + Clock
// =========================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

// =========================
// Stadium
// =========================
createStadium().then((stadium) => {
  stadiumRef = stadium;
  scene.add(stadium);

  scoreboardRef = stadium.getObjectByName("Scoreboard");

  // floodlights OFF në start
  stadium.userData?.floodlights?.userData?.setOn(false);
});

// =========================
// City
// =========================
createCity({ pitchW: 105, pitchD: 68 }).then((city) => {
  scene.add(city);
});

// =========================
// Night / Day switch
// =========================
function applyNightDay() {
  if (isNight) {
    ambient.intensity = 0.25;
    dir.intensity = 0.15;
    scene.environmentIntensity = 0.12;
    scene.background = NIGHT_BG;
  } else {
    ambient.intensity = 0.65;
    dir.intensity = 1.0;
    scene.environmentIntensity = 0.35;
    scene.background = dayHDRI ?? DAY_FALLBACK;
  }

  stadiumRef?.userData?.floodlights?.userData?.setOn(isNight);
}

function toggleNightDay() {
  isNight = !isNight;
  applyNightDay();
}

// =========================
// Click scoreboard
// =========================
window.addEventListener("pointerdown", (e) => {
  if (!scoreboardRef?.userData?.clickable) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(scoreboardRef.userData.clickable, true);

  if (hits.length > 0) scoreboardRef.userData.toggleMode?.();
});

// =========================
// Keys
// =========================
window.addEventListener("keydown", (e) => {
  if (e.key === "g" || e.key === "G") {
    scoreboardRef?.userData?.goalFlash?.();
  }

  if (e.key === "n" || e.key === "N") {
    toggleNightDay();
  }
});

// =========================
// Render loop
// =========================
function animate() {
  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  controls.update();
  scoreboardRef?.userData?.update?.(dt);
  stadiumRef?.userData?.update?.(dt);

  renderer.render(scene, camera);
}

animate();
