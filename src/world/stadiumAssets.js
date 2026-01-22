// src/world/stadiumAssets.js
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

export async function createAssets({
  USE_STAND_TEXTURE = true,
  USE_PITCH_TEXTURE = true,
  USE_ROOF_TEXTURE = true,
} = {}) {
  const texLoader = new THREE.TextureLoader();
  const exrLoader = new EXRLoader();

  const loadTex = (url, opts = {}) =>
    new Promise((resolve, reject) => {
      texLoader.load(
        url,
        (t) => {
          if (opts.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
          if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
          if (opts.colorSpace) t.colorSpace = opts.colorSpace;
          if (opts.anisotropy) t.anisotropy = opts.anisotropy;
          resolve(t);
        },
        undefined,
        reject
      );
    });

  const loadEXR = (url, opts = {}) =>
    new Promise((resolve, reject) => {
      exrLoader.load(
        url,
        (t) => {
          if (opts.wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
          if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
          t.colorSpace = THREE.NoColorSpace;
          if (opts.anisotropy) t.anisotropy = opts.anisotropy;
          resolve(t);
        },
        undefined,
        reject
      );
    });

  // Stand concrete
  const concrete = USE_STAND_TEXTURE
    ? await loadTex("/textures/stand/brushed_concrete_2_diff_4k.jpg", {
        wrap: true,
        repeat: [6, 2],
        colorSpace: THREE.SRGBColorSpace,
        anisotropy: 2,
      })
    : null;

  // Pitch grass (direct load, si te kodi yt)
  let grassMap = null;
  if (USE_PITCH_TEXTURE) {
    grassMap = texLoader.load("/textures/pitch/grass_diff.jpg");
    grassMap.wrapS = grassMap.wrapT = THREE.RepeatWrapping;
    grassMap.repeat.set(10, 6);
    grassMap.colorSpace = THREE.SRGBColorSpace;
    grassMap.anisotropy = 4;
    grassMap.needsUpdate = true;

    // ti i ke edhe normal/rough, po s’i përdor te materiali aktual -> i lëmë jashtë që mos me u rëndu kot
  }

  // Roof (ti vetëm roofDiff e përdor te materiali, maps tjera i ke load po nuk i përdor)
  let roofDiff = null;
  if (USE_ROOF_TEXTURE) {
    roofDiff = await loadTex("/textures/roof/roof_diff.jpg", {
      wrap: true,
      repeat: [8, 2],
      colorSpace: THREE.SRGBColorSpace,
      anisotropy: 4,
    });

    // i lëmë load-ët si te kodi yt (nëse ma vonë do i lidhësh)
    await loadEXR("/textures/roof/roof_normal.exr", { wrap: true, repeat: [8, 2], anisotropy: 2 });
    await loadEXR("/textures/roof/roof_rough.exr",  { wrap: true, repeat: [8, 2], anisotropy: 2 });
    await loadEXR("/textures/roof/roof_metal.exr",  { wrap: true, repeat: [8, 2], anisotropy: 2 });
  }

  return { concrete, grassMap, roofDiff };
}
