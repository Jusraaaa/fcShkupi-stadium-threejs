// src/world/lights.js
import * as THREE from "three";

export function setupLights(scene) {
  // =========================
  // AMBIENT LIGHT
  // =========================
  // Dritë bazë që mos me u bo skena krejt e zezë
  // Shërben si “fill light”
  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  // =========================
  // SUN / DIRECTIONAL LIGHT
  // =========================
  // Simulon diellin nga lart
  // Kjo është drita kryesore për pitch + shadows
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(60, 140, 60); // shumë lart → shadows më natyrale
  sun.castShadow = true;

  // =========================
  // SHADOW QUALITY
  // =========================
  // Rezolucion i mirë për stadium (balanced performance)
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;

  // Volumi i kamerës së shadow
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 400;
  sun.shadow.camera.left = -150;
  sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150;
  sun.shadow.camera.bottom = -150;

  // =========================
  // TARGET (qendra e fushës)
  // =========================
  // Shadows dhe drejtimi i dritës fokusohen në pitch
  sun.target.position.set(0, 0, 0);
  scene.add(sun.target);

  // ✅ micro-fix safe: siguron target korrekt në world
  sun.target.updateMatrixWorld();

  scene.add(sun);

  return { ambient, sun };
}
