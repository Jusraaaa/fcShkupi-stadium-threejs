// src/world/lights.js
import * as THREE from "three";

export function setupLights(scene) {
  // Ambient - që mos me u bo gjithçka zi
  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  // "Sun" prej lart - pitch (horizontal) ka nevojë për këtë
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(60, 140, 60); // y lart!!
  sun.castShadow = true;

  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 400;
  sun.shadow.camera.left = -150;
  sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150;
  sun.shadow.camera.bottom = -150;

  sun.target.position.set(0, 0, 0);
  scene.add(sun.target);
  scene.add(sun);

  return { ambient, sun };
}
