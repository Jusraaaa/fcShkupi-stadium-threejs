// src/world/pitchLines.js
import * as THREE from "three";

export function createPitchLines(pitchW = 105, pitchD = 68) {
  const g = new THREE.Group();
  g.name = "PitchLines";

  // MeshBasicMaterial = vijat duken gjithmonë (pa u varë prej dritave)
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

  const y = 0.012;     // pak mbi pitch që mos me "z-fight"
  const lineW = 0.10;  // trashësi vize pak ma e dukshme

  function rectOutline(w, d, xOff = 0, zOff = 0) {
    const group = new THREE.Group();

    const hGeo = new THREE.PlaneGeometry(w, lineW);
    const vGeo = new THREE.PlaneGeometry(lineW, d);

    const top = new THREE.Mesh(hGeo, lineMat);
    top.rotation.x = -Math.PI / 2;
    top.position.set(xOff, y, zOff + d / 2);

    const bottom = new THREE.Mesh(hGeo, lineMat);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.set(xOff, y, zOff - d / 2);

    const left = new THREE.Mesh(vGeo, lineMat);
    left.rotation.x = -Math.PI / 2;
    left.position.set(xOff - w / 2, y, zOff);

    const right = new THREE.Mesh(vGeo, lineMat);
    right.rotation.x = -Math.PI / 2;
    right.position.set(xOff + w / 2, y, zOff);

    group.add(top, bottom, left, right);
    return group;
  }

  function ring(radius) {
    const geo = new THREE.RingGeometry(radius - lineW / 2, radius + lineW / 2, 128);
    const m = new THREE.Mesh(geo, lineMat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    return m;
  }

  // ✅ Outer boundary
  g.add(rectOutline(pitchW, pitchD));

  // ✅ Mid line
  const midLine = new THREE.Mesh(new THREE.PlaneGeometry(lineW, pitchD), lineMat);
  midLine.rotation.x = -Math.PI / 2;
  midLine.position.set(0, y, 0);
  g.add(midLine);

  // ✅ Center circle + spot
  g.add(ring(9.15));
  const centerSpot = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), lineMat);
  centerSpot.rotation.x = -Math.PI / 2;
  centerSpot.position.y = y;
  g.add(centerSpot);

  // ✅ Boxes (FIFA)
  const goalBoxDepth = 5.5;
  const goalBoxW = 7.32 + 2 * 5.5;    // 18.32
  const penBoxDepth = 16.5;
  const penBoxW = 7.32 + 2 * 16.5;    // 40.32

  const leftX = -pitchW / 2;
  const rightX = pitchW / 2;

  // Left side boxes
  g.add(rectOutline(goalBoxDepth, goalBoxW, leftX + goalBoxDepth / 2, 0));
  g.add(rectOutline(penBoxDepth, penBoxW, leftX + penBoxDepth / 2, 0));

  // Right side boxes
  g.add(rectOutline(goalBoxDepth, goalBoxW, rightX - goalBoxDepth / 2, 0));
  g.add(rectOutline(penBoxDepth, penBoxW, rightX - penBoxDepth / 2, 0));

  // ✅ Penalty spots (11m nga goal line)
  const penSpotGeo = new THREE.CircleGeometry(0.22, 32);

  const leftPen = new THREE.Mesh(penSpotGeo, lineMat);
  leftPen.rotation.x = -Math.PI / 2;
  leftPen.position.set(leftX + 11, y, 0);
  g.add(leftPen);

  const rightPen = new THREE.Mesh(penSpotGeo, lineMat);
  rightPen.rotation.x = -Math.PI / 2;
  rightPen.position.set(rightX - 11, y, 0);
  g.add(rightPen);

  // ✅ Penalty arcs (vetëm gjysma jashtë pen box)
  // Majtas: duam gjysmën NË DREJTIM të qendrës (pra +X) => theta -90..+90
  // Djathtas: duam gjysmën NË DREJTIM të qendrës (pra -X) => theta +90..+270
  function penaltyArc(xCenter, side) {
    const r = 9.15;

    const thetaStart = side === "left" ? -Math.PI / 2 : Math.PI / 2;
    const thetaLen = Math.PI;

    const geo = new THREE.RingGeometry(
      r - lineW / 2,
      r + lineW / 2,
      128,
      1,
      thetaStart,
      thetaLen
    );

    const m = new THREE.Mesh(geo, lineMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(xCenter, y, 0);
    return m;
  }

  g.add(penaltyArc(leftX + 11, "left"));
  g.add(penaltyArc(rightX - 11, "right"));

  return g;
}
