// src/world/models.js
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

// =========================
// GLTF
// =========================
const gltfLoader = new GLTFLoader();

// ✅ kthen edhe scene edhe animations
export function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) =>
        resolve({
          scene: gltf.scene,
          animations: gltf.animations || [],
        }),
      undefined,
      (err) => reject(err)
    );
  });
}

// =========================
// FBX
// =========================
const fbxLoader = new FBXLoader();

export function loadFBX(url) {
  return new Promise((resolve, reject) => {
    fbxLoader.load(
      url,
      (obj) => resolve(obj),
      undefined,
      (err) => reject(err)
    );
  });
}
