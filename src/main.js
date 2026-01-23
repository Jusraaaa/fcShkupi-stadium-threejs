// src/main.js
import scene from "./core/scene.js";
import camera from "./core/camera.js";
import renderer from "./core/renderer.js";
import { setupResize } from "./utils/resize.js";
import { createStadium } from "./world/stadium.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { createCity } from "./world/city.js";


import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";

// --------------------
// Lights (base scene) ✅ (kto i kontrollon me N)
// --------------------
const ambient = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(5, 14, 8);
dir.castShadow = true;
dir.shadow.mapSize.width = 1024;
dir.shadow.mapSize.height = 1024;
scene.add(dir);

let isNight = false;

// ✅ ruaj HDRI e ditës këtu (që me mujt me e kthy prap)
let dayHDRI = null;



// --------------------
// HDRI (Day Sky) ✅
// --------------------
scene.background = new THREE.Color(0x87b7ff); // fallback nëse HDRI s'osht loaded ende

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

new EXRLoader().load("/hdri/day.exr", (tex) => {
  tex.mapping = THREE.EquirectangularReflectionMapping;

  const envMap = pmrem.fromEquirectangular(tex).texture;

  scene.environment = envMap;       // reflektime/ndriçim
  scene.environmentIntensity = 0.35;

  dayHDRI = tex;                    // ✅ ruaje
  scene.background = tex;           // ✅ ditë = HDRI sky

  // ⛔ MOS e dispose tex, se na duhet për me e kthy prap ditën
  pmrem.dispose();

  // nëse je në night kur e load-on HDRI, mos e prish night background
  applyNightDay();
});

// --------------------
// Sky Dome (mbyll botën)
// --------------------
const skyGeo = new THREE.SphereGeometry(800, 32, 16);
const skyMat = new THREE.MeshBasicMaterial({
  color: 0x9fd3ff,
  side: THREE.BackSide,
  transparent: true,
  opacity: 0.10, // 0 = s’e mbulon HDRI
});
const skyDome = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyDome);


// --------------------
// Controls
// --------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

controls.enableZoom = true;
controls.minDistance = 15;
controls.maxDistance = 200;

controls.maxPolarAngle = Math.PI * 0.49;
controls.minPolarAngle = Math.PI * 0.08;


controls.target.set(0, 5, 0);
controls.update();

setupResize(camera, renderer);

// --------------------
// Raycaster (click)
// --------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

// --------------------
// Stadium
// --------------------
createStadium().then((stadium) => {
  scene.add(stadium);

  // ✅ sigurohu që floodlights janë OFF në start
  const st = scene.getObjectByName("ChairStadium");
  st?.userData?.floodlights?.userData?.setOn(false);
});

// --------------------
// City (rreth stadiumit) ✅
// --------------------
createCity({ pitchW: 105, pitchD: 68 }).then((city) => {
  scene.add(city);
});


// Helpers
function getScoreboard() {
  return scene.getObjectByName("Scoreboard");
}

function getStadium() {
  return scene.getObjectByName("ChairStadium");
}

function applyNightDay() {
  if (isNight) {
    ambient.intensity = 0.25;
    dir.intensity = 0.15;

    scene.environmentIntensity = 0.12;
    scene.background = new THREE.Color(0x05070d); // natë (dark)

  } else {
    ambient.intensity = 0.65;
    dir.intensity = 1.0;

    scene.environmentIntensity = 0.35;

    // ✅ ditë = ktheje HDRI prap (nëse është loaded), përndryshe fallback blue
    scene.background = dayHDRI ?? new THREE.Color(0x87b7ff);
  }

  // ✅ ndiz/fik vetëm floodlights tona
  const st = getStadium();
  st?.userData?.floodlights?.userData?.setOn(isNight);
}

function toggleNightDay() {
  isNight = !isNight;
  applyNightDay();
}

// --------------------
// Click scoreboard -> toggle mode
// --------------------
window.addEventListener("pointerdown", (e) => {
  const sb = getScoreboard();
  if (!sb?.userData?.clickable) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(sb.userData.clickable, true);

  if (hits.length > 0) sb.userData.toggleMode?.();
});

// --------------------
// Keys: G goal, N night/day
// --------------------
window.addEventListener("keydown", (e) => {
  const sb = getScoreboard();

  if (e.key === "g" || e.key === "G") {
    sb?.userData?.goalFlash?.();
  }

  if (e.key === "n" || e.key === "N") {
    toggleNightDay();
  }
});

// --------------------
// Loop
// --------------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const dt = clock.getDelta();

  // update scoreboard
  const sb = getScoreboard();
  sb?.userData?.update?.(dt);

  // ✅ update stadium (flags + players + qka t’kesh lidhë aty)
  const st = getStadium();
  st?.userData?.update?.(dt);

  renderer.render(scene, camera);
}
animate();
