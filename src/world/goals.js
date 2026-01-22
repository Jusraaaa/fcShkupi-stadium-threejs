import * as THREE from "three";

export function createGoals(pitchW = 105) {
  const group = new THREE.Group();
  group.name = "Goals";

  // Madhësitë që po i përdor ti
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
  // ✅ NET TEXTURES (PATH OK)
  // =========================
  const loader = new THREE.TextureLoader();

  const netColor = loader.load("/textures/goals/net_color.png");
  const netAlpha = loader.load("/textures/goals/net_alpha.png");

  // për Vite/Three: Color texture në sRGB
  netColor.colorSpace = THREE.SRGBColorSpace;

  // shpesh textures dalin të përmbysura
  netColor.flipY = false;
  netAlpha.flipY = false;

  // Repeat për katrorë më të vegjël
  netColor.wrapS = netColor.wrapT = THREE.RepeatWrapping;
  netAlpha.wrapS = netAlpha.wrapT = THREE.RepeatWrapping;

  netColor.repeat.set(3, 2.2);
  netAlpha.repeat.copy(netColor.repeat);

  // ✅ rrjeta e bardhë “FORCE WHITE”
const netMat = new THREE.MeshBasicMaterial({
  alphaMap: netAlpha,     // përdor vetëm transparencën
  transparent: true,
  opacity: 1,
  alphaTest: 0.05,
  side: THREE.DoubleSide,
  color: 0xffffff,        // e bardhë
  depthWrite: false,

});


  function oneGoal(xPos) {
    const g = new THREE.Group();

    // Posts + crossbar
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

    // ✅ NET (plane meshes)
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
