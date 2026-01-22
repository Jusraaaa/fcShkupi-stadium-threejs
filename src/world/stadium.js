// src/world/stadium.js
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

import { createSeatsForLongStand } from "./seats.js";
import { createGoals } from "./goals.js";
import { createPitchLines } from "./pitchLines.js";
import { createScoreboard } from "./scoreboard.js";
import { loadGLTF } from "./models.js";
import { createFloodlights } from "./floodlights.js";

export async function createStadium() {
  const stadium = new THREE.Group();
  stadium.name = "ChairStadium";

  // =========================
  // TOGGLES (TRUE/FALSE)
  // =========================
  const USE_STAND_TEXTURE = true; // tribuna concrete
  const USE_PITCH_TEXTURE = true;  // bari në fushë
  const USE_ROOF_TEXTURE = true;   // corrugated metal në çati

  const pitchW = 105;
  const pitchD = 68;

  const margin = 18;
  const standH = 14;

  const standXLen = pitchW + 12;
  const standD = 15;
  const standGapFromPitch = 7;

  // =========================
  // LOADERS
  // =========================
  const texLoader = new THREE.TextureLoader();
  const exrLoader = new EXRLoader();

  const loadTex = (url, opts = {}) =>
    new Promise((resolve, reject) => {
      texLoader.load(
        url,
        (t) => {
          if (opts.wrap) {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
          }
          if (opts.repeat) {
            t.repeat.set(opts.repeat[0], opts.repeat[1]);
          }
          if (opts.colorSpace) {
            t.colorSpace = opts.colorSpace;
          }
          if (opts.anisotropy) {
            t.anisotropy = opts.anisotropy;
          }
          resolve(t);
        },
        undefined,
        reject
      );
    });

  const loadEXR = (url, opts = {}) =>
    new Promise((resolve, reject) => {
      exrLoader.load(
        url,
        (t) => {
          if (opts.wrap) {
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
          }
          if (opts.repeat) {
            t.repeat.set(opts.repeat[0], opts.repeat[1]);
          }
          // EXR maps zakonisht janë data-maps -> mos SRGB
          t.colorSpace = THREE.NoColorSpace;

          if (opts.anisotropy) {
            t.anisotropy = opts.anisotropy;
          }
          resolve(t);
        },
        undefined,
        reject
      );
    });

  // =========================
  // TEXTURES (ngarko 1 herë)
  // =========================
  // Stand concrete (ti e ke 4k — ok, veç s’është super light)
  const concrete = await loadTex("/textures/stand/brushed_concrete_2_diff_4k.jpg", {
    wrap: true,
    repeat: [6, 2],
    colorSpace: THREE.SRGBColorSpace,
    anisotropy: 2,
  });

 // =========================
// PITCH (GRASS) — LOAD DIRECT (NO AWAIT)
// =========================
let grassMap = null, grassNormal = null, grassRough = null;

if (USE_PITCH_TEXTURE) {
  grassMap = texLoader.load("/textures/pitch/grass_diff.jpg");
  grassMap.wrapS = grassMap.wrapT = THREE.RepeatWrapping;
  grassMap.repeat.set(10, 6);
  grassMap.colorSpace = THREE.SRGBColorSpace;
  grassMap.anisotropy = 4;
  grassMap.needsUpdate = true;


  grassNormal = texLoader.load("/textures/pitch/grass_normal.jpg");
grassNormal.wrapS = grassNormal.wrapT = THREE.RepeatWrapping;
grassNormal.repeat.set(10, 6);
grassNormal.colorSpace = THREE.NoColorSpace;

grassRough = texLoader.load("/textures/pitch/grass_rough.jpg");
grassRough.wrapS = grassRough.wrapT = THREE.RepeatWrapping;
grassRough.repeat.set(10, 6);
grassRough.colorSpace = THREE.NoColorSpace;

}


  // Roof (corrugated) — diff JPG, maps EXR
  let roofDiff = null, roofNormal = null, roofRough = null, roofMetal = null;
  if (USE_ROOF_TEXTURE) {
    roofDiff = await loadTex("/textures/roof/roof_diff.jpg", {
      wrap: true,
      repeat: [8, 2],
      colorSpace: THREE.SRGBColorSpace,
      anisotropy: 4,
    });

    roofNormal = await loadEXR("/textures/roof/roof_normal.exr", {
      wrap: true,
      repeat: [8, 2],
      anisotropy: 2,
    });

    roofRough = await loadEXR("/textures/roof/roof_rough.exr", {
      wrap: true,
      repeat: [8, 2],
      anisotropy: 2,
    });

    roofMetal = await loadEXR("/textures/roof/roof_metal.exr", {
      wrap: true,
      repeat: [8, 2],
      anisotropy: 2,
    });
  }

  // =========================
  // TOKA
  // =========================
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

  // =========================
  // BORDER
  // =========================
  const borderGeo = new THREE.PlaneGeometry(pitchW + 2, pitchD + 2);
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = -Math.PI / 2;
  border.position.y = -0.01;
  border.receiveShadow = true;
  stadium.add(border);

  // =========================
  // FUSHA (PITCH)
  // =========================
  const pitchGeo = new THREE.PlaneGeometry(pitchW, pitchD);

  const pitchMat = USE_PITCH_TEXTURE
  ? new THREE.MeshStandardMaterial({
      map: grassMap,
      roughness: 1.0,
      metalness: 0.0,
    })
  : new THREE.MeshStandardMaterial({ color: 0x1f6b3a });

  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitchMat.needsUpdate = true;

  pitch.rotation.x = -Math.PI / 2;
  pitch.receiveShadow = true;
  stadium.add(pitch);

  stadium.add(createPitchLines(pitchW, pitchD));
  stadium.add(createGoals(pitchW, pitchD));

  // =========================
  // SCOREBOARD
  // =========================
  const scoreboard = createScoreboard(pitchW, pitchD);
  stadium.add(scoreboard);
  stadium.userData.scoreboard = scoreboard;

  // =========================
  // TRIBUNAT (LONG SIDES)
  // =========================
  function buildLongStand(side = "north") {
    const zDir = side === "north" ? -1 : 1;

    const standShape = new THREE.Shape();
    standShape.moveTo(0, 0);
    standShape.lineTo(standD, 0);
    standShape.lineTo(standD, standH);
    standShape.lineTo(0, 2.6);
    standShape.lineTo(0, 0);

    const bodyGeo = new THREE.ExtrudeGeometry(standShape, {
      depth: standXLen,
      bevelEnabled: false,
      steps: 1,
    });

    bodyGeo.rotateY(-Math.PI / 2);
    bodyGeo.center();

    // ✅ MATERIALI i tribunës (toggle)
    const bodyMat = USE_STAND_TEXTURE
      ? new THREE.MeshStandardMaterial({
          map: concrete,
          roughness: 0.9,
          metalness: 0.0,
          side: THREE.DoubleSide,
        })
      : new THREE.MeshStandardMaterial({
          color: 0x2a2a2a,
          roughness: 0.95,
          metalness: 0.0,
          side: THREE.DoubleSide,
        });

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.name = `StandBody_${side}`;
    body.castShadow = true;
    body.receiveShadow = true;

    body.rotation.y = side === "north" ? Math.PI : 0;

    body.position.set(
      0,
      standH / 2,
      zDir * (pitchD / 2 + standGapFromPitch + standD / 2)
    );

    // =========================
    // KARRIGET – CHILD I BODY
    // =========================
    const seats = createSeatsForLongStand(body, side, {
      seatRows: 14,
      xSpacing: 1.6,
      zSpacing: 1.0,

      aisleCols: [12, 28, 44, 60],
      edgePaddingX: 2,
      midGapAuto: true,

      standH: standH,
      standD: standD,
      standFrontY: 2.6,

      edgeInsetZ: 1.3,
      zNudge: -0.6,
      baseLift: 0.02,
      slopeScale: 1.0,
      seatClearance: 0.3,
    });

    seats.name = `Seats_${side}`;
    body.add(seats);

    // =========================
    // ÇATIA (roof) — LOCAL
    // =========================
    const roofGeo = new THREE.BoxGeometry(standXLen + 10, 0.7, standD + 3);

    const roofMat = USE_ROOF_TEXTURE
  ? new THREE.MeshStandardMaterial({
      map: roofDiff,
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide,
    })
  : new THREE.MeshStandardMaterial({ color: 0x1b2333, roughness: 0.35, metalness: 0.65, side: THREE.DoubleSide });



    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.name = `Roof_${side}`;
    roof.castShadow = true;
    roof.receiveShadow = true;

    const roofY = standH / 2 + 6.5;
    const roofZLocal = standD / 2 + 2.4; // ✅ fix: gjithmonë mbrapa në LOCAL

    roof.position.set(0, roofY, roofZLocal);
    body.add(roof);

    // =========================
    // SUPPORTS / SHTYLLAT — te roof-i
    // =========================
    const supports = new THREE.Group();
    supports.name = `Supports_${side}`;

    const postMat = new THREE.MeshStandardMaterial({
  color: 0x2b2f36,
  roughness: 0.22,
  metalness: 1.0,
});



    const postCount = 8;
    const xMin = -(standXLen / 2) + 2;
    const xMax = standXLen / 2 - 2;

    const supportZ = roof.position.z;

    const bottomY = -standH / 2 + 0.2;
    const topY = roof.position.y - 0.3;
    const postH = Math.max(0.2, topY - bottomY);

    const postGeo = new THREE.CylinderGeometry(0.22, 0.22, postH, 12);


    for (let i = 0; i < postCount; i++) {
      const t = postCount === 1 ? 0.5 : i / (postCount - 1);
      const x = xMin + t * (xMax - xMin);

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, bottomY + postH / 2, supportZ);
      post.castShadow = true;
      post.receiveShadow = true;

      supports.add(post);
    }

    body.add(supports);

    // =========================
    // TRARET
    // =========================
    const beams = new THREE.Group();
    beams.name = `Beams_${side}`;

    const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, standD + 6, 12);

    const beamMat = new THREE.MeshStandardMaterial({
  color: 0x3a3f46,
  roughness: 0.18,
  metalness: 1.0,
});



    for (let i = -5; i <= 5; i++) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.z = Math.PI / 2;
      beam.position.set(i * 10, roof.position.y - 0.4, roof.position.z);
      beams.add(beam);
    }

    return { body, roof, beams };
  }

  const north = buildLongStand("north");
  stadium.add(north.body);

  const south = buildLongStand("south");
  stadium.add(south.body);

  // =========================
  // FLOODLIGHTS
  // =========================
  const floods = createFloodlights({ pitchW, pitchD });
  floods.position.y = 0;
  stadium.add(floods);
  stadium.userData.floodlights = floods;
  floods.userData.setOn(false);

  // =========================
  // MODELS – Dugouts
  // =========================
  try {
    const dugout = await loadGLTF("/models/dugout.glb");
    dugout.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    const d1 = dugout.clone(true);
    d1.position.set(0, 0, pitchD / 2 + 6);
    d1.rotation.y = Math.PI;
    d1.scale.set(3.5, 3.5, 3.5);
    stadium.add(d1);

    const d2 = dugout.clone(true);
    d2.position.set(0, 0, -(pitchD / 2 + 6));
    d2.scale.set(3.5, 3.5, 3.5);
    stadium.add(d2);
  } catch (e) {
    console.warn("Model load failed:", e);
  }

  // =========================
  // FUNDET (MURE)
  // =========================
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

  // =========================
  // RRUGA
  // =========================
  const roadGeo = new THREE.PlaneGeometry(pitchW + margin * 2 + 55, 10);
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.02, pitchD / 2 + margin + 18);
  road.receiveShadow = true;
  stadium.add(road);

  
  return stadium;
}
