// src/world/models.js
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

// =========================
// GLTF LOADER (shared instance)
// =========================
// Përdorim një loader të vetëm për gjithë projektin
// (më pak memory + më pak overhead)
const gltfLoader = new GLTFLoader();

/**
 * Load GLTF/GLB model
 * @param {string} url - path i modelit (.glb/.gltf)
 * @param {Object} options
 * @param {string} options.resourcePath - path për textures (nëse modeli i përdor)
 *
 * @returns {Promise<{scene: THREE.Object3D, animations: THREE.AnimationClip[]}>}
 */
export function loadGLTF(url, { resourcePath } = {}) {
  return new Promise((resolve, reject) => {
    // =========================
    // RESOURCE PATH SAFETY
    // =========================
    // Ruajmë resourcePath-in aktual të loader-it
    // që mos me ndiku në load-e tjera
    const prevResourcePath = gltfLoader.resourcePath || "";

    if (resourcePath) {
      gltfLoader.setResourcePath(resourcePath);
    }

    gltfLoader.load(
      url,
      (gltf) => {
        // Ktheje resourcePath siç ka qenë
        if (resourcePath) {
          gltfLoader.setResourcePath(prevResourcePath);
        }

        resolve({
          scene: gltf.scene,
          animations: gltf.animations || [],
        });
      },
      undefined,
      (err) => {
        // Gjithmonë kthe resourcePath-in edhe në error
        if (resourcePath) {
          gltfLoader.setResourcePath(prevResourcePath);
        }
        reject(err);
      }
    );
  });
}

// =========================
// FBX LOADER
// =========================
// FBX përdoret zakonisht për karaktere / animacione (Mixamo)
const fbxLoader = new FBXLoader();

/**
 * Load FBX model
 * @param {string} url - path i FBX file
 * @returns {Promise<THREE.Object3D>}
 */
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
