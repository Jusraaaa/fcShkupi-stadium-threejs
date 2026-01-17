// src/core/camera.js
import * as THREE from "three";

const camera = new THREE.PerspectiveCamera(
  60, // FOV
  window.innerWidth / window.innerHeight,
  0.1,  // near
  1000  // far
);

// Pozitë start (që ta shohësh stadiumin)
camera.position.set(0, 35, 85);
camera.lookAt(0, 0, 0);

export default camera;
