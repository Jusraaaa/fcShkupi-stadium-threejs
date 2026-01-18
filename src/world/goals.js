import * as THREE from "three";

export function createGoals(pitchW = 105) {
  const group = new THREE.Group();
  group.name = "Goals";

  const goalW = 7.32;
  const goalH = 2.44;
  const goalDepth = 2.2;
  const postR = 0.06;

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.05,
  });

  const netMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.18,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  function oneGoal(xPos) {
    const g = new THREE.Group();

    const postGeo = new THREE.CylinderGeometry(postR, postR, goalH, 16);
    const barGeo = new THREE.CylinderGeometry(postR, postR, goalW, 16);

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

    const backNet = new THREE.Mesh(new THREE.PlaneGeometry(goalW, goalH), netMat);
    backNet.position.set(0, goalH / 2, -goalDepth);

    const leftNet = new THREE.Mesh(new THREE.PlaneGeometry(goalDepth, goalH), netMat);
    leftNet.rotation.y = Math.PI / 2;
    leftNet.position.set(-goalW / 2, goalH / 2, -goalDepth / 2);

    const rightNet = new THREE.Mesh(new THREE.PlaneGeometry(goalDepth, goalH), netMat);
    rightNet.rotation.y = -Math.PI / 2;
    rightNet.position.set(goalW / 2, goalH / 2, -goalDepth / 2);

    const topNet = new THREE.Mesh(new THREE.PlaneGeometry(goalW, goalDepth), netMat);
    topNet.rotation.x = -Math.PI / 2;
    topNet.position.set(0, goalH, -goalDepth / 2);

    g.add(backNet, leftNet, rightNet, topNet);

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
