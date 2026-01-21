// src/world/seats.js
import * as THREE from "three";

export function createSeatsForLongStand(bodyMesh, side, cfg = {}) {
  const group = new THREE.Group();
  group.name = `Seats_${side}`;

  const seatRows = cfg.seatRows ?? 18;

  const xSpacing = cfg.xSpacing ?? 1.05;
  const zSpacing = cfg.zSpacing ?? 0.65;
  const yStep = cfg.yStep ?? 0.55;

  const aisleCols = cfg.aisleCols ?? [12, 28, 44, 60];

  const midGap = cfg.midGap ?? null;
  const midGapAuto = cfg.midGapAuto ?? true;

  const sectorEvery = cfg.sectorEvery ?? 20;
  const sectorGapCols = cfg.sectorGapCols ?? 1;

  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2b6cb0 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 });

  const seatBaseGeo = new THREE.BoxGeometry(0.9, 0.45, 0.9);
  const seatBackGeo = new THREE.BoxGeometry(0.9, 0.75, 0.2);

  bodyMesh.geometry.computeBoundingBox();
  const bb = bodyMesh.geometry.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);

  const standXLen = size.x;
  const standD = size.z;

    // ✅ shumë me rëndësi: sigurohu që matrixWorld është e freskët
  bodyMesh.updateWorldMatrix(true, false);


  const edgePaddingX = cfg.edgePaddingX ?? 2;
  const seatCols =
    cfg.seatCols ??
    Math.max(10, Math.floor((standXLen - edgePaddingX * 2) / xSpacing));

  const total = seatRows * seatCols;

  const baseBlue = new THREE.InstancedMesh(seatBaseGeo, blueMat, total);
  const backBlue = new THREE.InstancedMesh(seatBackGeo, blueMat, total);

  baseBlue.castShadow = baseBlue.receiveShadow = true;
  backBlue.castShadow = backBlue.receiveShadow = true;

  baseBlue.frustumCulled = false;
  backBlue.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const dummyBack = new THREE.Object3D();

  // north = -Z (tribuna në -Z), south = +Z
  const zDir = side === "north" ? -1 : 1;

  // fillimi në X
  const startX = -standXLen / 2 + edgePaddingX;

  // ==============================
  // ✅ GJEJ SKAJIN KAH FUSHA (robust)
  // Provo dy skajet: local +Z dhe local -Z
  // Zgjedh atë që në WORLD është më afër qendrës së fushës (z më afër 0)
  // ==============================
  const edgeA = new THREE.Vector3(0, 0, +standD / 2);
  const edgeB = new THREE.Vector3(0, 0, -standD / 2);

  bodyMesh.localToWorld(edgeA);
  bodyMesh.localToWorld(edgeB);

  const pitchEdgeZ = Math.abs(edgeA.z) < Math.abs(edgeB.z) ? edgeA.z : edgeB.z;

  // vendosi pak “brenda tribunës” (jo jashtë) në drejtim të kundërt të rreshtave
  const startZ = pitchEdgeZ + (-zDir) * 0.15;

  // midGap auto
  const gap = midGap
    ? midGap
    : midGapAuto
    ? {
        fromCol: Math.floor(seatCols / 2) - 2,
        toCol: Math.floor(seatCols / 2) + 2,
      }
    : null;

  // karriget gjithmonë kah fusha
  const seatRotY = side === "north" ? 0 : Math.PI;

  let bi = 0;

  for (let r = 0; r < seatRows; r++) {
    for (let c = 0; c < seatCols; c++) {
      if (aisleCols.includes(c)) continue;
      if (gap && c >= gap.fromCol && c <= gap.toCol) continue;

      if (sectorEvery > 0) {
        const mod = c % sectorEvery;
        if (mod >= 0 && mod < sectorGapCols) continue;
      }

      const y = 1.8 + r * yStep;

      const x = startX + c * xSpacing;
      const z = startZ + zDir * (r * zSpacing);

      dummy.position.set(x, y, z);
      dummy.rotation.y = seatRotY;
      dummy.updateMatrix();

      dummyBack.position.set(x, y + 0.55, z + zDir * 0.38);
      dummyBack.rotation.y = seatRotY;
      dummyBack.updateMatrix();

      baseBlue.setMatrixAt(bi, dummy.matrix);
      backBlue.setMatrixAt(bi, dummyBack.matrix);
      bi++;
    }
  }

  baseBlue.count = bi;
  backBlue.count = bi;

  baseBlue.instanceMatrix.needsUpdate = true;
  backBlue.instanceMatrix.needsUpdate = true;

  group.add(baseBlue, backBlue);

  // --------- Aisles të verdha ----------
  const aisleWidth = cfg.aisleWidth ?? 0.7;
  const aisleLen = cfg.aisleLen ?? seatRows * zSpacing + 2.5;
  const aisleGeo = new THREE.PlaneGeometry(aisleWidth, aisleLen);

  aisleCols.forEach((colIdx) => {
    if (colIdx < 0 || colIdx >= seatCols) return;

    const x = startX + colIdx * xSpacing;
    const zMid = startZ + zDir * (aisleLen / 2 - 1);

    const aisle = new THREE.Mesh(aisleGeo, yellowMat);
    aisle.rotation.x = -Math.PI / 2;
    aisle.position.set(x, 0.06, zMid);
    aisle.receiveShadow = true;
    group.add(aisle);
  });

  if (gap) {
    const midWidth = (gap.toCol - gap.fromCol + 1) * xSpacing;
    const midGeo = new THREE.PlaneGeometry(midWidth, aisleLen);
    const mid = new THREE.Mesh(midGeo, yellowMat);
    mid.rotation.x = -Math.PI / 2;

    const xMid = startX + ((gap.fromCol + gap.toCol) / 2) * xSpacing;
    const zMid = startZ + zDir * (aisleLen / 2 - 1);

    mid.position.set(xMid, 0.061, zMid);
    mid.receiveShadow = true;
    group.add(mid);
  }

  return group;
}
