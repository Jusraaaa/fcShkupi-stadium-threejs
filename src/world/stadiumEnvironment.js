// src/world/stadiumEnvironment.js
import * as THREE from "three";

export function addWallsAndRoad({ stadium, pitchW, pitchD, margin } = {}) {
  if (!stadium) return;

  // =========================
  // WALL MATERIAL
  // =========================
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.8,
    metalness: 0.05,
  });

  // =========================
  // SIDE WALLS (majtas / djathtas)
  // =========================
  const wallHeight = 3;
  const wallThickness = 1.2;
  const wallLength = pitchD + margin * 2 + 6;

  const wallGeo = new THREE.BoxGeometry(
    wallThickness,
    wallHeight,
    wallLength
  );

  // majtas
  const wallLeft = new THREE.Mesh(wallGeo, wallMat);
  wallLeft.position.set(-(pitchW / 2 + margin), wallHeight / 2, 0);
  wallLeft.castShadow = true;
  wallLeft.receiveShadow = true;
  stadium.add(wallLeft);

  // djathtas
  const wallRight = wallLeft.clone();
  wallRight.position.x = pitchW / 2 + margin;
  stadium.add(wallRight);

  // =========================
  // ROAD (pas stadiumit)
  // =========================
  const roadWidth = pitchW + margin * 2 + 55;
  const roadDepth = 10;

  const roadGeo = new THREE.PlaneGeometry(roadWidth, roadDepth);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.95,
    metalness: 0.0,
  });

  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;

  // pak poshtë për mos me pas z-fighting me terrenin
  road.position.set(0, -0.03, pitchD / 2 + margin + 18);

  road.receiveShadow = true;
  road.castShadow = false;

  stadium.add(road);
}
