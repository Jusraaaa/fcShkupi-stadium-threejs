import * as THREE from "three";

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#bg"),
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);

// ✅ LIMIT pixel ratio (kritike për performance + Vercel)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

// ✅ PBR / color pipeline
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

// ✅ Shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export default renderer;
