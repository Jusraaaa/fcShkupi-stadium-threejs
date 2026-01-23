// src/world/stadiumPitch.js
import * as THREE from "three";

/**
 * Krijon tokën rreth stadiumit + border-in + pitch-in (fushën)
 * Nuk ka animacione, vetëm mesh statik (performancë OK)
 */
export function createGroundAndPitch({
  stadium,
  pitchW,
  pitchD,
  margin,
  USE_PITCH_TEXTURE,
  grassMap,
} = {}) {
  if (!stadium) return;

  // =========================
  // TOKA (ground rreth stadiumit)
  // =========================
  // pak ma e madhe se stadiumi që mos me u pa fundi
  const siteGeo = new THREE.PlaneGeometry(
    pitchW + margin * 2 + 60,
    pitchD + margin * 2 + 60
  );

  const siteMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 1.0,
    metalness: 0.0,
  });

  const site = new THREE.Mesh(siteGeo, siteMat);
  site.rotation.x = -Math.PI / 2;
  site.position.y = -0.03; // pak poshtë pitch-it (anti z-fighting)
  site.receiveShadow = true;
  site.castShadow = false; // toka s’ka pse me bo shadow
  stadium.add(site);

  // =========================
  // BORDER rreth fushës
  // =========================
  // shërben si kornizë e errët
  const borderGeo = new THREE.PlaneGeometry(pitchW + 2, pitchD + 2);

  const borderMat = new THREE.MeshStandardMaterial({
    color: 0x0b0b0b,
    roughness: 0.95,
    metalness: 0.0,
  });

  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = -Math.PI / 2;
  border.position.y = -0.01; // mbi tokë, poshtë pitch-it
  border.receiveShadow = true;
  border.castShadow = false;
  stadium.add(border);

  // =========================
  // PITCH (fusha e lojës)
  // =========================
  const pitchGeo = new THREE.PlaneGeometry(pitchW, pitchD);

  const pitchMat = USE_PITCH_TEXTURE
    ? new THREE.MeshStandardMaterial({
        map: grassMap ?? null,
        roughness: 1.0,
        metalness: 0.0,
      })
    : new THREE.MeshStandardMaterial({
        color: 0x1f6b3a,
        roughness: 1.0,
        metalness: 0.0,
      });

  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = 0; // referencë 0 për vijat & topin
  pitch.receiveShadow = true;
  pitch.castShadow = false; // bari s’ka nevojë me bo shadow
  stadium.add(pitch);

  // ktheje për përdorim të mëtutjeshëm (p.sh collision, raycast)
  return { pitch };
}
