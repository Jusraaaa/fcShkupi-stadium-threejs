// src/world/seats.js
import * as THREE from "three";

export function createSeatsForLongStand(bodyMesh, side, cfg = {}) {
  const group = new THREE.Group();
  group.name = `Seats_${side}`;

  // =========================
  // CONFIG
  // =========================
  const seatRows = cfg.seatRows ?? 18;

  // spacing (ma real)
  const xSpacing = cfg.xSpacing ?? 1.15; // ishte 1.05
  const zSpacing = cfg.zSpacing ?? 0.75; // ishte 0.55

  // aisles/gaps
  const aisleCols = cfg.aisleCols ?? [12, 28, 44, 60];
  const aisleHalf = cfg.aisleHalf ?? 1; // 1 => 3 kolona gjerësi (c-1,c,c+1)
  const midGap = cfg.midGap ?? null;
  const midGapAuto = cfg.midGapAuto ?? true;

  const sectorEvery = cfg.sectorEvery ?? 0; // 0 = off (ma pak “random gaps”)
  const sectorGapCols = cfg.sectorGapCols ?? 1;

  // walkway horizontal (landing)
  const walkwayRows = cfg.walkwayRows ?? [7]; // 0-based row index
  const addWalkwayPlatform = cfg.addWalkwayPlatform ?? true;
  const walkwayDepth = cfg.walkwayDepth ?? 1.6;
  const walkwayThick = cfg.walkwayThick ?? 0.12;

  // tribuna
  const standH = cfg.standH ?? 14;
  const standFrontY = cfg.standFrontY ?? 2.6;
  const standD = cfg.standD ?? 15;

  // pozicionim mbi slope
  const baseLift = cfg.baseLift ?? 0.02;         // pak lift
  const slopeScale = cfg.slopeScale ?? 1.0;      // 1.0 = ndjek slope real
  const edgeInsetZ = cfg.edgeInsetZ ?? 1.2;      // larg prej fushës
  const zNudge = cfg.zNudge ?? 0.0;

  // mos me hy mrena
  const seatClearance = cfg.seatClearance ?? 0.09;

  // =========================
  // SLOPE
  // =========================
  const rise = standH - standFrontY;
  const slopeAngle = Math.atan(rise / standD);
  const standSlopeTan = Math.tan(slopeAngle);
  const seatSlopeTan = standSlopeTan * slopeScale;

  // =========================
  // MATERIALS
  // =========================
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x1f4fa3,
    roughness: 0.55,
    metalness: 0.05,
  });

  const aisleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const walkwayMat = new THREE.MeshStandardMaterial({
    color: 0x0f0f0f,
    roughness: 0.9,
    metalness: 0.0,
  });

  // =========================
  // GEOMETRIES
  // =========================
  const seatBaseGeo = new THREE.BoxGeometry(0.9, 0.45, 0.9);
  const seatBackGeo = new THREE.BoxGeometry(0.9, 0.75, 0.2);

  // =========================
  // BOUNDS (stand length)
  // =========================
  bodyMesh.geometry.computeBoundingBox();
  const bb = bodyMesh.geometry.boundingBox;
  const size = new THREE.Vector3();
  bb.getSize(size);

  const standXLen = size.x;

  bodyMesh.updateWorldMatrix(true, false);

  const edgePaddingX = cfg.edgePaddingX ?? 2;
  const seatCols =
    cfg.seatCols ??
    Math.max(10, Math.floor((standXLen - edgePaddingX * 2) / xSpacing));

  // instanced count (upper bound)
  const total = seatRows * seatCols;

  const baseInst = new THREE.InstancedMesh(seatBaseGeo, seatMat, total);
  const backInst = new THREE.InstancedMesh(seatBackGeo, seatMat, total);

  baseInst.castShadow = baseInst.receiveShadow = true;
  backInst.castShadow = backInst.receiveShadow = true;
  baseInst.frustumCulled = false;
  backInst.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const dummyBack = new THREE.Object3D();

  const startX = -standXLen / 2 + edgePaddingX;

  // ==============================
  // gjej skajin kah fusha (robust)
  // ==============================
  const edgeALocalZ = +standD / 2;
  const edgeBLocalZ = -standD / 2;

  const edgeAWorld = new THREE.Vector3(0, 0, edgeALocalZ);
  const edgeBWorld = new THREE.Vector3(0, 0, edgeBLocalZ);
  bodyMesh.localToWorld(edgeAWorld);
  bodyMesh.localToWorld(edgeBWorld);

  const pitchEdgeLocalZ =
    Math.abs(edgeAWorld.z) < Math.abs(edgeBWorld.z) ? edgeALocalZ : edgeBLocalZ;

  // rreshtat shkojnë larg fushës
  const rowDir = pitchEdgeLocalZ > 0 ? -1 : 1;

  // startZ
  const startZ = pitchEdgeLocalZ + rowDir * (edgeInsetZ + zNudge);

  // orientimi i karrikeve kah fusha
  const seatRotY = rowDir === 1 ? 0 : Math.PI;

  // bodyGeo.center() => origin është në mes
  const baseYLocal = -standH / 2 + standFrontY;

  function yOnSlopeAtZ(zLocal) {
    const depthFromFront = Math.max(0, (zLocal - pitchEdgeLocalZ) * rowDir);

    // y reale e sipërfaqes
    const ySurface = baseYLocal + depthFromFront * standSlopeTan;

    // y e karrikes (mundet me u “sheshos”)
    const ySeat = baseYLocal + depthFromFront * seatSlopeTan;

    // garanci mos me hy nmesh
    return Math.max(ySeat, ySurface + seatClearance) + baseLift;
  }

  // mid gap auto (nëse s’ka midGap)
  const gap = midGap
    ? midGap
    : midGapAuto
    ? {
        fromCol: Math.floor(seatCols / 2) - 2,
        toCol: Math.floor(seatCols / 2) + 2,
      }
    : null;

  // =========================
  // HELPERS
  // =========================
  const isInAisle = (c) => aisleCols.some((a) => Math.abs(c - a) <= aisleHalf);
  const isWalkwayRow = (r) => walkwayRows.includes(r);

  // =========================
  // PLACE SEATS
  // =========================
  let bi = 0;

  for (let r = 0; r < seatRows; r++) {
    if (isWalkwayRow(r)) continue;

    for (let c = 0; c < seatCols; c++) {
      if (isInAisle(c)) continue;
      if (gap && c >= gap.fromCol && c <= gap.toCol) continue;

      if (sectorEvery > 0) {
        const mod = c % sectorEvery;
        if (mod >= 0 && mod < sectorGapCols) continue;
      }

      const x = startX + c * xSpacing;
      const z = startZ + rowDir * (r * zSpacing);
      const y = yOnSlopeAtZ(z);

      dummy.position.set(x, y, z);
      dummy.rotation.y = seatRotY;
      dummy.updateMatrix();

      dummyBack.position.set(x, y + 0.55, z + rowDir * 0.38);
      dummyBack.rotation.y = seatRotY;
      dummyBack.updateMatrix();

      baseInst.setMatrixAt(bi, dummy.matrix);
      backInst.setMatrixAt(bi, dummyBack.matrix);
      bi++;
    }
  }

  baseInst.count = bi;
  backInst.count = bi;
  baseInst.instanceMatrix.needsUpdate = true;
  backInst.instanceMatrix.needsUpdate = true;

  group.add(baseInst, backInst);

  // =========================
  // WALKWAY PLATFORM (landing)
  // =========================
  if (addWalkwayPlatform && walkwayRows.length > 0) {
    const walkwayRow = walkwayRows[0];

    const walkwayWidth = standXLen - edgePaddingX * 2;
    const walkwayGeo = new THREE.BoxGeometry(
      walkwayWidth,
      walkwayThick,
      walkwayDepth
    );

    const zWalk = startZ + rowDir * (walkwayRow * zSpacing);
    const yWalk = yOnSlopeAtZ(zWalk) - 0.28;

    const walkway = new THREE.Mesh(walkwayGeo, walkwayMat);
    walkway.position.set(0, yWalk, zWalk);
    walkway.receiveShadow = true;
    group.add(walkway);
  }

  // =========================
  // STAIRS (treads) for each aisle column
  // =========================
  const treadH = cfg.treadH ?? 0.08;
  const treadLen = cfg.treadLen ?? (zSpacing * 0.92);

  // gjerësia e korridorit = (2*aisleHalf+1) kolona * xSpacing
  const corridorW = (2 * aisleHalf + 1) * xSpacing * 0.9;

  const treadGeo = new THREE.BoxGeometry(corridorW, treadH, treadLen);

  aisleCols.forEach((colIdx) => {
    if (colIdx < 0 || colIdx >= seatCols) return;

    const x = startX + colIdx * xSpacing;

    for (let r = 0; r < seatRows; r++) {
      if (isWalkwayRow(r)) continue;

      const z = startZ + rowDir * (r * zSpacing);
      const y = yOnSlopeAtZ(z) - 0.30;

      const tread = new THREE.Mesh(treadGeo, aisleMat);
      tread.position.set(x, y, z);
      tread.castShadow = false;
      tread.receiveShadow = true;
      group.add(tread);
    }
  });

  // =========================
  // MID GAP STAIRS (optional)
  // =========================
  if (gap) {
    const midW = (gap.toCol - gap.fromCol + 1) * xSpacing * 0.9;
    const midTreadGeo = new THREE.BoxGeometry(midW, treadH, treadLen);

    const xMid = startX + ((gap.fromCol + gap.toCol) / 2) * xSpacing;

    for (let r = 0; r < seatRows; r++) {
      if (isWalkwayRow(r)) continue;

      const z = startZ + rowDir * (r * zSpacing);
      const y = yOnSlopeAtZ(z) - 0.30;

      const tread = new THREE.Mesh(midTreadGeo, aisleMat);
      tread.position.set(xMid, y, z);
      tread.castShadow = false;
      tread.receiveShadow = true;
      group.add(tread);
    }
  }

  return group;
}
