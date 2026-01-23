// src/world/models.js
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

// =========================
// GLTF
// =========================
const gltfLoader = new GLTFLoader();

// ✅ kthen edhe scene edhe animations
export function loadGLTF(url, { resourcePath } = {}) {
  return new Promise((resolve, reject) => {
    // ruaje path-in e vjeter (nese e ke set diku)
    const prev = gltfLoader.resourcePath || "";

    if (resourcePath) gltfLoader.setResourcePath(resourcePath);

    gltfLoader.load(
      url,
      (gltf) => {
        // ktheje resourcePath si ka qenë
        if (resourcePath) gltfLoader.setResourcePath(prev);

        resolve({
          scene: gltf.scene,
          animations: gltf.animations || [],
        });
      },
      undefined,
      (err) => {
        if (resourcePath) gltfLoader.setResourcePath(prev);
        reject(err);
      }
    );
  });
}

// =========================
// FBX
// =========================
const fbxLoader = new FBXLoader();

export function loadFBX(url) {
  return new Promise((resolve, reject) => {
    fbxLoader.load(url, (obj) => resolve(obj), undefined, (err) => reject(err));
  });
}
