// src/main.js
import scene from "./core/scene.js";
import camera from "./core/camera.js";
import renderer from "./core/renderer.js";
import { setupResize } from "./utils/resize.js";
import { createStadium } from "./world/stadium.js";
import { setupLights } from "./world/lights.js";


import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";

// --------------------
// Lights (base scene)
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

setupLights(scene);


// --------------------
// Controls
// --------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

controls.enableZoom = true;
controls.minDistance = 15;
controls.maxDistance = 200;

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

// Helpers
function getScoreboard() {
  return scene.getObjectByName("Scoreboard");
}

function getStadium() {
  return scene.getObjectByName("ChairStadium");
}

function applyNightDay() {
  // ✅ mos e “vrit” krejt skenën
  if (isNight) {
    ambient.intensity = 0.40;
    dir.intensity = 0.55;
  } else {
    ambient.intensity = 0.65;
    dir.intensity = 1.0;
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
  const sb = getScoreboard();
  sb?.userData?.update?.(dt);

  renderer.render(scene, camera);
}
animate();
