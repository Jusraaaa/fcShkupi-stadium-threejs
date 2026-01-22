// src/world/stadiumEnvironment.js
import * as THREE from "three";

export function addWallsAndRoad({ stadium, pitchW, pitchD, margin } = {}) {
  // MURE
  const endWallMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
  const endWallGeo = new THREE.BoxGeometry(1.2, 3, pitchD + margin * 2 + 6);

  const wallLeft = new THREE.Mesh(endWallGeo, endWallMat);
  wallLeft.position.set(-(pitchW / 2 + margin), 1.5, 0);
  wallLeft.castShadow = true;
  wallLeft.receiveShadow = true;
  stadium.add(wallLeft);

  const wallRight = new THREE.Mesh(endWallGeo, endWallMat);
  wallRight.position.set(pitchW / 2 + margin, 1.5, 0);
  wallRight.castShadow = true;
  wallRight.receiveShadow = true;
  stadium.add(wallRight);

  // RRUGA
  const roadGeo = new THREE.PlaneGeometry(pitchW + margin * 2 + 55, 10);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.02, pitchD / 2 + margin + 18);
  road.receiveShadow = true;
  stadium.add(road);
}
