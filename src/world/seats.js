// src/world/seats.js
import * as THREE from "three";

/**
 * Krijon karrige (instanced) + korridore/shalat + walkway për tribunën e gjatë.
 * - bodyMesh: mesh-i i tribunës (slope body)
 * - side: string (p.sh. "north"/"south") për name
 * - cfg: opsione për spacing, rows, aisles, slope, etj.
 */
export function createSeatsForLongStand(bodyMesh, side, cfg = {}) {
  const group = new THREE.Group();
  group.name = `Seats_${side}`;

  // =========================
  // CONFIG (defaults)
  // =========================
  const seatRows = cfg.seatRows ?? 18;

  // spacing i karrigeve (ma real)
  const xSpacing = cfg.xSpacing ?? 1.15;
  const zSpacing = cfg.zSpacing ?? 0.75;

  // aisles / gaps (korridore vertikale)
  const aisleCols = cfg.aisleCols ?? [12, 28, 44, 60];
  const aisleHalf = cfg.aisleHalf ?? 1; // 1 => 3 kolona gjerësi (c-1,c,c+1)

  // mid gap (korridor në mes)
  const midGap = cfg.midGap ?? null;
  const midGapAuto = cfg.midGapAuto ?? true;

  // sector gaps (random-ish) -> default OFF (ma clean)
  const sectorEvery = cfg.sectorEvery ?? 0;
  const sectorGapCols = cfg.sectorGapCols ?? 1;

  // walkway horizontal (landing)
  const walkwayRows = cfg.walkwayRows ?? [7]; // 0-based row index
  const addWalkwayPlatform = cfg.addWalkwayPlatform ?? true;
  const walkwayDepth = cfg.walkwayDepth ?? 1.6;
  const walkwayThick = cfg.walkwayThick ?? 0.12;

  // tribuna (për slope)
  const standH = cfg.standH ?? 14;
  const standFrontY = cfg.standFrontY ?? 2.6;
  const standD = cfg.standD ?? 15;

  // pozicionim mbi slope
  const baseLift = cfg.baseLift ?? 0.02; // lift i vogël mbi surface
  const slopeScale = cfg.slopeScale ?? 1.0; // 1.0 = ndjek slope real
  const edgeInsetZ = cfg.edgeInsetZ ?? 1.2; // larg prej fushës
  const zNudge = cfg.zNudge ?? 0.0;

  // clearance: mos me u fut karriget brenda mesh-it
  const seatClearance = cfg.seatClearance ?? 0.09;

  // =========================
  // SLOPE math
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
  // GEOMETRIES (seat base + back)
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

  // siguro world matrix (për localToWorld)
  bodyMesh.updateWorldMatrix(true, false);

  const edgePaddingX = cfg.edgePaddingX ?? 2;

  // sa kolona karrigeve futen në tribunë
  const seatCols =
    cfg.seatCols ??
    Math.max(10, Math.floor((standXLen - edgePaddingX * 2) / xSpacing));

  // =========================
  // Instanced meshes (super performance)
  // =========================
  const total = seatRows * seatCols; // upper bound
  const baseInst = new THREE.InstancedMesh(seatBaseGeo, seatMat, total);
  const backInst = new THREE.InstancedMesh(seatBackGeo, seatMat, total);

  // ✅ shadows (si i kishe)
  baseInst.castShadow = baseInst.receiveShadow = true;
  backInst.castShadow = backInst.receiveShadow = true;

  // ✅ mos u "zhduk" kur kamera sillet
  baseInst.frustumCulled = false;
  backInst.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const dummyBack = new THREE.Object3D();

  // start X (majtas -> djathtas)
  const startX = -standXLen / 2 + edgePaddingX;

  // ==============================
  // Gjej skajin kah fusha (robust)
  // ==============================
  const edgeALocalZ = +standD / 2;
  const edgeBLocalZ = -standD / 2;

  const edgeAWorld = new THREE.Vector3(0, 0, edgeALocalZ);
  const edgeBWorld = new THREE.Vector3(0, 0, edgeBLocalZ);
  bodyMesh.localToWorld(edgeAWorld);
  bodyMesh.localToWorld(edgeBWorld);

  // cili skaj është më afër origjinës (pitch)
  const pitchEdgeLocalZ =
    Math.abs(edgeAWorld.z) < Math.abs(edgeBWorld.z) ? edgeALocalZ : edgeBLocalZ;

  // rreshtat shkojnë larg fushës
  const rowDir = pitchEdgeLocalZ > 0 ? -1 : 1;

  // startZ (rreshti i parë afër fushës)
  const startZ = pitchEdgeLocalZ + rowDir * (edgeInsetZ + zNudge);

  // orientimi i karrikeve kah fusha
  const seatRotY = rowDir === 1 ? 0 : Math.PI;

  // bodyGeo.center() => origin është në mes
  const baseYLocal = -standH / 2 + standFrontY;

  /**
   * Jep Y për një Z lokal, duke ndjek slope-in e tribunës.
   * - ySurface: sipërfaqja reale e tribunës
   * - ySeat: sipërfaqja e "seats slope" (mundet me u sheshos)
   * - kthen max(ySeat, ySurface+clearance) + lift
   */
  function yOnSlopeAtZ(zLocal) {
    const depthFromFront = Math.max(0, (zLocal - pitchEdgeLocalZ) * rowDir);

    const ySurface = baseYLocal + depthFromFront * standSlopeTan;
    const ySeat = baseYLocal + depthFromFront * seatSlopeTan;

    return Math.max(ySeat, ySurface + seatClearance) + baseLift;
  }

  // mid gap auto (nëse s’ke midGap)
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
  // PLACE SEATS (instanced)
  // =========================
  let bi = 0;

  for (let r = 0; r < seatRows; r++) {
    // rreshtat e walkway-it s’kan karrige
    if (isWalkwayRow(r)) continue;

    for (let c = 0; c < seatCols; c++) {
      if (isInAisle(c)) continue;
      if (gap && c >= gap.fromCol && c <= gap.toCol) continue;

      // optional: sector gaps
      if (sectorEvery > 0) {
        const mod = c % sectorEvery;
        if (mod >= 0 && mod < sectorGapCols) continue;
      }

      const x = startX + c * xSpacing;
      const z = startZ + rowDir * (r * zSpacing);
      const y = yOnSlopeAtZ(z);

      // seat base
      dummy.position.set(x, y, z);
      dummy.rotation.y = seatRotY;
      dummy.updateMatrix();

      // seat back (pak mbrapa + ma nalt)
      dummyBack.position.set(x, y + 0.55, z + rowDir * 0.38);
      dummyBack.rotation.y = seatRotY;
      dummyBack.updateMatrix();

      baseInst.setMatrixAt(bi, dummy.matrix);
      backInst.setMatrixAt(bi, dummyBack.matrix);
      bi++;
    }
  }

  // instanced count real (sa u vendosën)
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

    // ✅ shadows i ruaj (si e kishe)
    walkway.receiveShadow = true;
    walkway.castShadow = false;

    group.add(walkway);
  }

  // =========================
  // STAIRS / TREADS (optimized: InstancedMesh)
  // =========================
  const treadH = cfg.treadH ?? 0.08;
  const treadLen = cfg.treadLen ?? zSpacing * 0.92;

  // gjerësia e korridorit = (2*aisleHalf+1) kolona * xSpacing
  const corridorW = (2 * aisleHalf + 1) * xSpacing * 0.9;
  const treadGeo = new THREE.BoxGeometry(corridorW, treadH, treadLen);

  // sa treads maksimum (aisleCols * seatRows) (walkway rows përjashtohen, por s’prish)
  const maxAisleTreads = aisleCols.length * seatRows;
  const aisleTreadsInst = new THREE.InstancedMesh(
    treadGeo,
    aisleMat,
    maxAisleTreads
  );

  // stairs/treads nuk kanë nevojë me cast shadow, veç receive (si e kishe)
  aisleTreadsInst.castShadow = false;
  aisleTreadsInst.receiveShadow = true;
  aisleTreadsInst.frustumCulled = false;

  let ti = 0;

  aisleCols.forEach((colIdx) => {
    if (colIdx < 0 || colIdx >= seatCols) return;

    const x = startX + colIdx * xSpacing;

    for (let r = 0; r < seatRows; r++) {
      if (isWalkwayRow(r)) continue;

      const z = startZ + rowDir * (r * zSpacing);
      const y = yOnSlopeAtZ(z) - 0.30;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();

      aisleTreadsInst.setMatrixAt(ti, dummy.matrix);
      ti++;
    }
  });

  aisleTreadsInst.count = ti;
  aisleTreadsInst.instanceMatrix.needsUpdate = true;
  group.add(aisleTreadsInst);

  // =========================
  // MID GAP STAIRS (optional) -> edhe këto instanced
  // =========================
  if (gap) {
    const midW = (gap.toCol - gap.fromCol + 1) * xSpacing * 0.9;
    const midTreadGeo = new THREE.BoxGeometry(midW, treadH, treadLen);

    const maxMid = seatRows;
    const midInst = new THREE.InstancedMesh(midTreadGeo, aisleMat, maxMid);
    midInst.castShadow = false;
    midInst.receiveShadow = true;
    midInst.frustumCulled = false;

    const xMid = startX + ((gap.fromCol + gap.toCol) / 2) * xSpacing;

    let mi = 0;
    for (let r = 0; r < seatRows; r++) {
      if (isWalkwayRow(r)) continue;

      const z = startZ + rowDir * (r * zSpacing);
      const y = yOnSlopeAtZ(z) - 0.30;

      dummy.position.set(xMid, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();

      midInst.setMatrixAt(mi, dummy.matrix);
      mi++;
    }

    midInst.count = mi;
    midInst.instanceMatrix.needsUpdate = true;
    group.add(midInst);
  }

  return group;
}
