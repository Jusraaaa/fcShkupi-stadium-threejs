// src/world/city.js
import * as THREE from "three";
import { loadGLTF } from "./models.js";

// Random helpers
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function createCity({ pitchW = 105, pitchD = 68 } = {}) {
  const g = new THREE.Group();
  g.name = "City";

  // =========================
  // MODELS (nga public/)
  // =========================
  const buildingFiles = [
    "/models/city/building-type-a.glb",
    "/models/city/building-type-d.glb",
    "/models/city/building-type-g.glb",
    "/models/city/building-type-k.glb",
    "/models/city/building-type-n.glb",
    "/models/city/building-type-t.glb",
  ];

  const treeFiles = ["/models/city/tree-large.glb", "/models/city/tree-small.glb"];
  const fenceFiles = ["/models/city/fence-low.glb", "/models/city/fence-3x3.glb"];
  const drivewayFiles = ["/models/city/driveway-long.glb", "/models/city/driveway-short.glb"];

  // =========================
  // MATERIALS (vetëm për objekte pa texture)
  // - Building: e lemë ORIGJINAL që me dal texture e GLB-së
  // =========================
  function makeMat(color, { roughness = 0.95, metalness = 0.0 } = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }

  const treeMat = makeMat(0x2f8f2f, { roughness: 1.0, metalness: 0.0 });
  const fenceMat = makeMat(0x1f2937, { roughness: 0.9, metalness: 0.05 });
  const drivewayMat = makeMat(0x3a3a3a, { roughness: 1.0, metalness: 0.0 });

  function applyMaterial(root, mat) {
    root.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true;
        o.receiveShadow = true;

        // Mbuloje me material të thjeshtë (për drunj/fence/driveway)
        o.material = mat.clone();
        o.material.side = THREE.DoubleSide;
        o.material.needsUpdate = true;
      }
    });
  }

  // =========================
  // CACHE (mos i reload modelet 100 herë)
  // =========================
  const cache = new Map();

  async function getModel(path, kind) {
    if (!cache.has(path)) {
      // resourcePath ndihmon për textures të brendshme të GLB
      cache.set(path, loadGLTF(path, { resourcePath: "/models/city/" }));
    }

    const gltf = await cache.get(path);
    const root = gltf.scene.clone(true);

    if (kind === "tree") {
      applyMaterial(root, treeMat);
    } else if (kind === "fence") {
      applyMaterial(root, fenceMat);
    } else if (kind === "driveway") {
      applyMaterial(root, drivewayMat);
    } else if (kind === "building") {
      // ✅ Building: MOS ia ndrysho materialin -> ruaj texture origjinale
      root.traverse((o) => {
        if (o.isMesh || o.isSkinnedMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
    }

    return root;
  }

  // =========================
  // NO-SPAWN ZONE (stadiumi + buffer)
  // =========================
  const margin = 18;

  const BLOCK = {
    minX: -(pitchW / 2 + margin + 80),
    maxX: +(pitchW / 2 + margin + 80),
    minZ: -(pitchD / 2 + margin + 80),
    maxZ: +(pitchD / 2 + margin + 80),
  };

  function isInsideBlockedZone(x, z) {
    return x > BLOCK.minX && x < BLOCK.maxX && z > BLOCK.minZ && z < BLOCK.maxZ;
  }

  // =========================
  // RING spawn rreth stadiumit
  // (që mos me dalin “shum larg”)
  // =========================
  const innerR = Math.max(pitchW, pitchD) * 0.65 + margin + 55;
  const outerR = innerR + 170;

  function randomPosInRing() {
    const a = rand(0, Math.PI * 2);
    const r = rand(innerR, outerR);
    return { x: Math.cos(a) * r, z: Math.sin(a) * r };
  }

  function findSafeSpot() {
    let x = 0, z = 0;
    for (let tries = 0; tries < 140; tries++) {
      const p = randomPosInRing();
      x = p.x; z = p.z;
      if (!isInsideBlockedZone(x, z)) return { x, z };
    }
    return { x, z };
  }

  // =========================
  // GROUND
  // =========================
  const groundGeo = new THREE.PlaneGeometry(1200, 1200);
  const groundMat = makeMat(0x2f3b2f, { roughness: 1, metalness: 0 });

  // polygonOffset = mos me u “z-fight” me objekte tjera
  groundMat.polygonOffset = true;
  groundMat.polygonOffsetFactor = 1;
  groundMat.polygonOffsetUnits = 1;

  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.025;
  ground.receiveShadow = true;
  g.add(ground);

  // =========================
  // BUILDINGS
  // =========================
  const buildingCount = 12;
  for (let i = 0; i < buildingCount; i++) {
    const file = pick(buildingFiles);
    const m = await getModel(file, "building");

    const { x, z } = findSafeSpot();
    m.position.set(x, 0, z);
    m.rotation.y = rand(0, Math.PI * 2);

    const s = rand(14.5, 18.0);
    m.scale.setScalar(s);

    g.add(m);
  }

  // =========================
  // TREES
  // =========================
  const treeCount = 26;
  for (let i = 0; i < treeCount; i++) {
    const file = pick(treeFiles);
    const t = await getModel(file, "tree");

    const { x, z } = findSafeSpot();
    t.position.set(x, 0, z);
    t.rotation.y = rand(0, Math.PI * 2);

    const s = rand(20.0, 22.2);
    t.scale.setScalar(s);

    g.add(t);
  }

  // =========================
  // DRIVEWAYS
  // =========================
  const drivewayCount = 7;
  for (let i = 0; i < drivewayCount; i++) {
    const file = pick(drivewayFiles);
    const d = await getModel(file, "driveway");

    const { x, z } = findSafeSpot();
    d.position.set(x, 0.01, z);
    d.rotation.y = Math.round(rand(0, 3)) * (Math.PI / 2);
    d.scale.setScalar(rand(4.8, 7.2));

    g.add(d);
  }

  // =========================
  // FENCE RING afër stadiumit
  // =========================
  const fenceBase = await getModel(pick(fenceFiles), "fence");
  fenceBase.scale.setScalar(8);

  const fenceGroup = new THREE.Group();
  fenceGroup.name = "FenceRing";

  const ringW = pitchW + 2 * (margin + 10);
  const ringD = pitchD + 2 * (margin + 10);
  const step = 12;

  for (let x = -ringW / 2; x <= ringW / 2; x += step) {
    const f1 = fenceBase.clone(true);
    f1.position.set(x, 0, -ringD / 2);
    fenceGroup.add(f1);

    const f2 = fenceBase.clone(true);
    f2.position.set(x, 0, ringD / 2);
    fenceGroup.add(f2);
  }

  for (let z = -ringD / 2; z <= ringD / 2; z += step) {
    const f3 = fenceBase.clone(true);
    f3.position.set(-ringW / 2, 0, z);
    f3.rotation.y = Math.PI / 2;
    fenceGroup.add(f3);

    const f4 = fenceBase.clone(true);
    f4.position.set(ringW / 2, 0, z);
    f4.rotation.y = Math.PI / 2;
    fenceGroup.add(f4);
  }

  g.add(fenceGroup);

  console.log("✅ CITY LOADED", g.children.length);
  return g;
}
