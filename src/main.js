// src/main.js
import scene from "./core/scene.js";
import camera from "./core/camera.js";
import renderer from "./core/renderer.js";
import { setupResize } from "./utils/resize.js";
import { createStadium } from "./world/stadium.js";



import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as THREE from "three";

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(5, 10, 7);
dir.castShadow = true;
scene.add(dir);

// Stadium
createStadium().then((stadium) => {
  scene.add(stadium);

  
});

// Orbit Controls ✅
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

controls.enableZoom = true;
controls.minDistance = 15;
controls.maxDistance = 200;

controls.target.set(0, 5, 0); // ku “shikon” kamera
controls.update();

setupResize(camera, renderer);

function animate() {
  requestAnimationFrame(animate);
  controls.update(); // shumë e rëndësishme
  renderer.render(scene, camera);
}
animate();
