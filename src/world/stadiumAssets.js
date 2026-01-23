// src/world/stadiumAssets.js
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

// ✅ simple cache (mos me reload textures nëse thirret createAssets() prap)
const CACHE = {
  concrete: null,
  grassMap: null,
  roofDiff: null,
  roofNormal: null,
  roofRough: null,
  roofMetal: null,
};

export async function createAssets({
  USE_STAND_TEXTURE = true,
  USE_PITCH_TEXTURE = true,
  USE_ROOF_TEXTURE = true,

  // ✅ NEW: default FALSE (se këto s’i përdor materialet tua aktualisht)
  loadExtraRoofMaps = false,
} = {}) {
  const texLoader = new THREE.TextureLoader();
  const exrLoader = new EXRLoader();

  // -------------------------
  // Helper: load JPG/PNG
  // -------------------------
  const loadTex = (url, opts = {}) =>
    new Promise((resolve, reject) => {
      texLoader.load(
        url,
        (t) => {
          if (opts.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
          if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
          if (opts.colorSpace) t.colorSpace = opts.colorSpace;
          if (opts.anisotropy) t.anisotropy = opts.anisotropy;
          t.needsUpdate = true;
          resolve(t);
        },
        undefined,
        reject
      );
    });

  // -------------------------
  // Helper: load EXR (normal/rough/metal)
  // EXR = data map -> NoColorSpace
  // -------------------------
  const loadEXR = (url, opts = {}) =>
    new Promise((resolve, reject) => {
      exrLoader.load(
        url,
        (t) => {
          if (opts.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
          if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);

          // ✅ EXR maps janë data (jo ngjyra)
          t.colorSpace = THREE.NoColorSpace;

          if (opts.anisotropy) t.anisotropy = opts.anisotropy;
          t.needsUpdate = true;
          resolve(t);
        },
        undefined,
        reject
      );
    });

  // =========================
  // STAND concrete
  // =========================
  let concrete = null;

  if (USE_STAND_TEXTURE) {
    if (!CACHE.concrete) {
      CACHE.concrete = await loadTex(
        "/textures/stand/brushed_concrete_2_diff_4k.jpg",
        {
          wrap: true,
          repeat: [6, 2],
          colorSpace: THREE.SRGBColorSpace,
          anisotropy: 2,
        }
      );
    }
    concrete = CACHE.concrete;
  }

  // =========================
  // PITCH grass
  // =========================
  let grassMap = null;

  if (USE_PITCH_TEXTURE) {
    if (!CACHE.grassMap) {
      CACHE.grassMap = await loadTex("/textures/pitch/grass_diff.jpg", {
        wrap: true,
        repeat: [10, 6],
        colorSpace: THREE.SRGBColorSpace,
        anisotropy: 4,
      });
    }
    grassMap = CACHE.grassMap;
  }

  // =========================
  // ROOF (diffuse)
  // =========================
  let roofDiff = null;

  if (USE_ROOF_TEXTURE) {
    if (!CACHE.roofDiff) {
      CACHE.roofDiff = await loadTex("/textures/roof/roof_diff.jpg", {
        wrap: true,
        repeat: [8, 2],
        colorSpace: THREE.SRGBColorSpace,
        anisotropy: 4,
      });
    }
    roofDiff = CACHE.roofDiff;

    // ✅ OPTIONAL: extra maps vetëm kur t’i kërkon
    // (ndryshe e lehtëson CPU/VRAM dhe build)
    if (loadExtraRoofMaps) {
      if (!CACHE.roofNormal) {
        CACHE.roofNormal = await loadEXR("/textures/roof/roof_normal.exr", {
          wrap: true,
          repeat: [8, 2],
          anisotropy: 2,
        });
      }
      if (!CACHE.roofRough) {
        CACHE.roofRough = await loadEXR("/textures/roof/roof_rough.exr", {
          wrap: true,
          repeat: [8, 2],
          anisotropy: 2,
        });
      }
      if (!CACHE.roofMetal) {
        CACHE.roofMetal = await loadEXR("/textures/roof/roof_metal.exr", {
          wrap: true,
          repeat: [8, 2],
          anisotropy: 2,
        });
      }
    }
  }

  // Kthejmë vetëm çka përdor realisht stadiumi tani
  return { concrete, grassMap, roofDiff };
}
