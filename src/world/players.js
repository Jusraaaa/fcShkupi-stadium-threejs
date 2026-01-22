// src/world/players.js
import * as THREE from "three";
import { loadFBX, loadGLTF } from "./models.js";

export async function createPlayers({ pitchW = 105, pitchD = 68 } = {}) {
  const g = new THREE.Group();
  g.name = "Players";

  const mixers = [];

  // =========================
  // Helpers
  // =========================
  function setupModel(root, { scale = 0.02 } = {}) {
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) o.material.side = THREE.DoubleSide;
      }
    });
    root.scale.setScalar(scale);
    return root;
  }

  function playFirstAnimation(root, animations, { timeScale = 1.0 } = {}) {
    if (!animations || animations.length === 0) return null;

    const mixer = new THREE.AnimationMixer(root);
    const action = mixer.clipAction(animations[0]);
    action.reset();
    action.play();
    action.timeScale = timeScale;
    mixers.push(mixer);
    return mixer;
  }

  // =========================
  // 1) GOALKEEPER (FBX Mixamo)
  // =========================
  const goalkeeper = await loadFBX("/models/goalkeeper.fbx");
  setupModel(goalkeeper, { scale: 0.02 });
  goalkeeper.position.set(0, 0, pitchD / 2 - 5);
  goalkeeper.rotation.y = Math.PI;
  g.add(goalkeeper);
  playFirstAnimation(goalkeeper, goalkeeper.animations, { timeScale: 1.0 });

  // =========================
  // 2) DEFENDER (FBX Mixamo)
  // =========================
  const defender = await loadFBX("/models/defender.fbx");
  setupModel(defender, { scale: 0.02 });
  defender.position.set(-12, 0, 5);
  defender.rotation.y = Math.PI / 2;
  g.add(defender);
  playFirstAnimation(defender, defender.animations, { timeScale: 1.0 });

  // =========================
  // 3) STRIKER (FBX Mixamo)
  // =========================
  const striker = await loadFBX("/models/striker.fbx");
  setupModel(striker, { scale: 0.02 });
  striker.position.set(8, 0, -6);
  striker.rotation.y = -Math.PI / 2;
  g.add(striker);
  playFirstAnimation(striker, striker.animations, { timeScale: 1.0 });

  // =========================
  // 4) SKETCHFAB ANIMATED (GLB)
  //    - file: public/models/SoccerTrip.glb
  // =========================
  try {
    // ✅ tash loadGLTF kthen { scene, animations }
    const gltf = await loadGLTF("/models/SoccerTrip.glb");
    const sketch = gltf.scene;

    // GLB zakonisht do scale tjetër
    setupModel(sketch, { scale: 0.08 });

    // pozita afër qendrës
    sketch.position.set(0, 0, -2);
    sketch.rotation.y = Math.PI;
    g.add(sketch);

    // ✅ animacioni merret prej gltf.animations
    playFirstAnimation(sketch, gltf.animations, { timeScale: 1.0 });
  } catch (e) {
    console.warn("Sketchfab GLB not loaded:", e);
  }

  // =========================
  // Update (thirret në loop)
  // =========================
  g.userData.update = (dt) => {
    for (const m of mixers) m.update(dt);
  };

  return g;
}
