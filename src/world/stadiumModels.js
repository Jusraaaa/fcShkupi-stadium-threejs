// src/world/stadiumModels.js
import { loadGLTF } from "./models.js";

export async function addDugouts({ stadium, pitchD } = {}) {
  try {
    const dugout = await loadGLTF("/models/dugout.glb");
    dugout.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    const d1 = dugout.clone(true);
    d1.position.set(0, 0, pitchD / 2 + 6);
    d1.rotation.y = Math.PI;
    d1.scale.set(3.5, 3.5, 3.5);
    stadium.add(d1);

    const d2 = dugout.clone(true);
    d2.position.set(0, 0, -(pitchD / 2 + 6));
    d2.scale.set(3.5, 3.5, 3.5);
    stadium.add(d2);
  } catch (e) {
    console.warn("Model load failed:", e);
  }
}
