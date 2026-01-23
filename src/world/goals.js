// src/world/goals.js
import * as THREE from "three";

export function createGoals(pitchW = 105) {
  const group = new THREE.Group();
  group.name = "Goals";

  // Madhësitë (si i ke vendos ti)
  const goalW = 10.32;
  const goalH = 4.44;
  const goalDepth = 2.8;
  const postR = 0.06;

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.05,
  });

  // =========================
  // NET TEXTURES (Vite path)
  // =========================
  const loader = new THREE.TextureLoader();

  // ✅ përdorim vetëm alpha për rrjetë “FORCE WHITE”
  const netAlpha = loader.load("/textures/goals/net_alpha.png");

  // Nëse te ti del mirë kështu, mos e prek
  netAlpha.flipY = false;

  netAlpha.wrapS = netAlpha.wrapT = THREE.RepeatWrapping;
  netAlpha.repeat.set(3, 2.2);

  // ✅ rrjeta e bardhë me alphaMap
  const netMat = new THREE.MeshBasicMaterial({
    alphaMap: netAlpha,
    transparent: true,
    opacity: 1,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
    color: 0xffffff,
    depthWrite: false, // rrjeta del ma “clean” (pa z-fighting)
  });

  function oneGoal(xPos) {
    const g = new THREE.Group();

    // =========================
    // Posts + crossbar
    // =========================
    const postGeo = new THREE.CylinderGeometry(postR, postR, goalH, 20);
    const barGeo = new THREE.CylinderGeometry(postR, postR, goalW, 20);

    const leftPost = new THREE.Mesh(postGeo, whiteMat);
    leftPost.position.set(-goalW / 2, goalH / 2, 0);

    const rightPost = new THREE.Mesh(postGeo, whiteMat);
    rightPost.position.set(goalW / 2, goalH / 2, 0);

    const crossbar = new THREE.Mesh(barGeo, whiteMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, goalH, 0);

    [leftPost, rightPost, crossbar].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
    });

    g.add(leftPost, rightPost, crossbar);

    // =========================
    // NET (plane meshes)
    // =========================
    const backNet = new THREE.Mesh(
      new THREE.PlaneGeometry(goalW, goalH, 20, 12),
      netMat
    );
    backNet.position.set(0, goalH / 2, -goalDepth);

    const leftNet = new THREE.Mesh(
      new THREE.PlaneGeometry(goalDepth, goalH, 12, 12),
      netMat
    );
    leftNet.rotation.y = Math.PI / 2;
    leftNet.position.set(-goalW / 2, goalH / 2, -goalDepth / 2);

    const rightNet = new THREE.Mesh(
      new THREE.PlaneGeometry(goalDepth, goalH, 12, 12),
      netMat
    );
    rightNet.rotation.y = -Math.PI / 2;
    rightNet.position.set(goalW / 2, goalH / 2, -goalDepth / 2);

    const topNet = new THREE.Mesh(
      new THREE.PlaneGeometry(goalW, goalDepth, 20, 12),
      netMat
    );
    topNet.rotation.x = -Math.PI / 2;
    topNet.position.set(0, goalH, -goalDepth / 2);

    // ✅ “Sag” i lehtë në backNet (ma reale)
    const pos = backNet.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      const nx = x / (goalW / 2);
      const ny = (y - goalH / 2) / (goalH / 2);

      const centerPull = 1 - Math.min(1, Math.sqrt(nx * nx + ny * ny));
      pos.setZ(i, pos.getZ(i) - 0.25 * centerPull);
    }
    pos.needsUpdate = true;
    backNet.geometry.computeVertexNormals(); // një herë (safe)

    g.add(backNet, leftNet, rightNet, topNet);

    // Pozicioni/rotacioni si e kishe
    g.position.set(xPos, 0, 0);
    g.rotation.y = xPos > 0 ? -Math.PI / 2 : Math.PI / 2;

    return g;
  }

  const halfW = pitchW / 2;
  const offsetFromLine = 0.25;

  group.add(oneGoal(-(halfW + offsetFromLine)));
  group.add(oneGoal(halfW + offsetFromLine));

  return group;
}
