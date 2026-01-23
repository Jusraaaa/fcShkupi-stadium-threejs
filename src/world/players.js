// src/world/players.js
import * as THREE from "three";
import { loadFBX, loadGLTF } from "./models.js";

// =========================
// Texture për topin (checker)
// =========================
function createCheckerTexture(size = 256, squares = 10) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const s = size / squares;

  for (let y = 0; y < squares; y++) {
    for (let x = 0; x < squares; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#f5f5f5" : "#111111";
      ctx.fillRect(x * s, y * s, s, s);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export async function createPlayers({ pitchW = 105, pitchD = 68 } = {}) {
  const g = new THREE.Group();
  g.name = "Players";

  const mixers = [];

  // =========================
  // Uniform materials (maicë + shorts)
  // =========================
  const jerseyMat = new THREE.MeshStandardMaterial({
    color: 0x0b3d91,
    roughness: 0.8,
    metalness: 0.0,
  });

  const shortsMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.0,
  });

  // =========================
  // Helpers
  // =========================
  function applyUniformMaterial(root) {
    root.traverse((o) => {
      if (!o.isMesh) return;

      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;

      const name = (o.name || "").toLowerCase();

      // Heuristikë: pjesët e poshtme -> shorts
      const isShorts =
        name.includes("leg") ||
        name.includes("pant") ||
        name.includes("short") ||
        name.includes("thigh") ||
        name.includes("hip") ||
        name.includes("calf") ||
        name.includes("foot");

      o.material = isShorts ? shortsMat : jerseyMat;
      o.material.side = THREE.DoubleSide;
      o.material.needsUpdate = true;
    });

    root.frustumCulled = false;
  }

  function setupScale(root, scale = 0.028) {
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

  // GLB auto-center + ground + scale
  function fitCenterGround(root, { targetSize = 6 } = {}) {
    root.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // qendroje në X/Z
    root.position.x += -center.x;
    root.position.z += -center.z;

    // tokë: minY = 0
    root.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(root);
    root.position.y += -box2.min.y;

    // scale te targetSize
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? targetSize / maxDim : 1;
    root.scale.multiplyScalar(s);
  }

  // Dummy clones (statik) për mbushje
  function spawnDummyFrom(source, pos, rotY, scale = 0.028) {
    const d = source.clone(true);
    d.position.copy(pos);
    d.rotation.y = rotY ?? 0;
    d.scale.setScalar(scale);

    applyUniformMaterial(d);
    g.add(d);
    return d;
  }

  // =========================
  // Load FBX players (Mixamo)
  // =========================
  const goalkeeper = await loadFBX("/models/goalkeeper.fbx");
  setupScale(goalkeeper, 0.028);
  applyUniformMaterial(goalkeeper);
  goalkeeper.position.set(0, 0, -pitchD / 2 + 5.5);
  goalkeeper.rotation.y = 0;
  g.add(goalkeeper);
  playFirstAnimation(goalkeeper, goalkeeper.animations, { timeScale: 1.0 });

  const defender = await loadFBX("/models/defender.fbx");
  setupScale(defender, 0.028);
  applyUniformMaterial(defender);
  defender.position.set(-10, 0, -pitchD / 2 + 16);
  defender.rotation.y = 0;
  g.add(defender);
  playFirstAnimation(defender, defender.animations, { timeScale: 1.0 });

  const striker = await loadFBX("/models/striker.fbx");
  setupScale(striker, 0.028);
  applyUniformMaterial(striker);
  striker.position.set(2, 0, -2);
  striker.rotation.y = -Math.PI / 2;
  g.add(striker);
  playFirstAnimation(striker, striker.animations, { timeScale: 1.0 });

  // =========================
  // Load GLB player (SoccerTrip)
  // =========================
  try {
    const gltf = await loadGLTF("/models/SoccerTrip.glb");
    const sketch = gltf.scene;
    sketch.name = "SoccerTrip";

    applyUniformMaterial(sketch);
    sketch.rotation.set(0, Math.PI, 0);

    sketch.position.set(0, 0, 0);
    sketch.scale.set(1, 1, 1);
    fitCenterGround(sketch, { targetSize: 4.5 });

    sketch.position.set(12, 0.02, -2);
    g.add(sketch);

    playFirstAnimation(sketch, gltf.animations, { timeScale: 1.0 });
  } catch (e) {
    console.warn("❌ SoccerTrip GLB not loaded:", e);
  }

  // =========================
  // Extra dummy players
  // =========================
  spawnDummyFrom(defender, new THREE.Vector3(-2, 0, -2), 0, 0.028);
  spawnDummyFrom(striker, new THREE.Vector3(3, 0, 2), -Math.PI / 2, 0.028);
  spawnDummyFrom(defender, new THREE.Vector3(-6, 0, 6), Math.PI / 2, 0.028);
  spawnDummyFrom(striker, new THREE.Vector3(8, 0, 10), -Math.PI / 2, 0.028);

  spawnDummyFrom(defender, new THREE.Vector3(-6, 0, -pitchD / 2 + 20), 0, 0.028);
  spawnDummyFrom(striker, new THREE.Vector3(6, 0, -pitchD / 2 + 22), 0, 0.028);

  // =========================
  // FOOTBALL (topi)
  // =========================
  const ballGroup = new THREE.Group();
  ballGroup.name = "Ball";

  const ballGeo = new THREE.SphereGeometry(0.5, 32, 32);
  const ballTex = createCheckerTexture(256, 10);

  const ballMat = new THREE.MeshStandardMaterial({
    map: ballTex,
    roughness: 0.5,
    metalness: 0.0,
  });

  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.castShadow = true;
  ball.receiveShadow = true;
  ballGroup.add(ball);

  // start në mes
  ballGroup.position.set(0, 0.55, 0);
  g.add(ballGroup);

  // =========================
  // PASS anim (A <-> B)
  // =========================
  const passA = new THREE.Vector3().copy(striker.position).add(new THREE.Vector3(0, 0.55, 0));
  const passB = new THREE.Vector3().copy(defender.position).add(new THREE.Vector3(0, 0.55, 0));

  let passT = 0;           // 0..1
  let passDir = 1;         // 1 ose -1
  const passSpeed = 0.35;  // shpejtësia

  // =========================
  // Update loop (mixers + ball)
  // =========================
  g.userData.update = (dt) => {
    // animacionet e lojtarëve
    for (const m of mixers) m.update(dt);

    // topi: lëvizje A <-> B
    passT += dt * passSpeed * passDir;
    if (passT >= 1) { passT = 1; passDir = -1; }
    if (passT <= 0) { passT = 0; passDir = 1; }

    ballGroup.position.lerpVectors(passA, passB, passT);
    ballGroup.position.y += Math.sin(passT * Math.PI) * 0.25; // hark i vogël
    ballGroup.rotation.y += dt * 3.0; // rrotullim
  };

  return g;
}
