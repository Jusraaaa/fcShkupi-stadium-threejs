// src/world/stadiumPitch.js
import * as THREE from "three";

export function createGroundAndPitch({
  stadium,
  pitchW,
  pitchD,
  margin,
  USE_PITCH_TEXTURE,
  grassMap,
} = {}) {
  // TOKA
  const siteGeo = new THREE.PlaneGeometry(
    pitchW + margin * 2 + 60,
    pitchD + margin * 2 + 60
  );
  const siteMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const site = new THREE.Mesh(siteGeo, siteMat);
  site.rotation.x = -Math.PI / 2;
  site.position.y = -0.03;
  site.receiveShadow = true;
  stadium.add(site);

  // BORDER
  const borderGeo = new THREE.PlaneGeometry(pitchW + 2, pitchD + 2);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = -Math.PI / 2;
  border.position.y = -0.01;
  border.receiveShadow = true;
  stadium.add(border);

  // PITCH
  const pitchGeo = new THREE.PlaneGeometry(pitchW, pitchD);

  const pitchMat = USE_PITCH_TEXTURE
    ? new THREE.MeshStandardMaterial({
        map: grassMap ?? null,
        roughness: 1.0,
        metalness: 0.0,
      })
    : new THREE.MeshStandardMaterial({ color: 0x1f6b3a });

  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.receiveShadow = true;
  stadium.add(pitch);

  return { pitch };
}
