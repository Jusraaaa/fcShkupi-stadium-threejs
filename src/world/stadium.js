// src/world/stadium.js
import * as THREE from "three";
import { createSeatsForLongStand } from "./seats";
import { createGoals } from "./goals";
import { createPitchLines } from "./pitchLines";
import { createScoreboard } from "./scoreboard";
import { loadGLTF } from "./models";


export async function createStadium() {
  const stadium = new THREE.Group();
  stadium.name = "ChairStadium";

  const pitchW = 105;
  const pitchD = 68;

  const margin = 18;
  const standH = 14;

  const standXLen = pitchW + 12;
  const standD = 15;
  const standGapFromPitch = 7;

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
  // FUSHA
  // =========================
  const pitchGeo = new THREE.PlaneGeometry(pitchW, pitchD);
  const pitchMat = new THREE.MeshStandardMaterial({ color: 0x1f6b3a });
  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.receiveShadow = true;
  stadium.add(pitch);

  stadium.add(createPitchLines(pitchW, pitchD));
  stadium.add(createGoals(pitchW, pitchD));

    // =========================
  // SCOREBOARD (LED + Click Modes)
  // =========================
  const scoreboard = createScoreboard(pitchW, pitchD);
  stadium.add(scoreboard);

  // ruaje referencën që me e përdor main.js (update + click)
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

    // DoubleSide që mos me pas probleme me “zhdukje” prej anës
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      side: THREE.DoubleSide,
    });

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.name = `StandBody_${side}`;
    body.castShadow = true;
    body.receiveShadow = true;

    // ✅ orientimi i saktë i tribunës kah fusha
body.rotation.y = side === "north" ? Math.PI : 0;


    body.position.set(
      0,
      standH / 2,
      zDir * (pitchD / 2 + standGapFromPitch + standD / 2)
    );

    const seats = createSeatsForLongStand(body, side, {
      seatRows: 18,
      xSpacing: 1.05,
      zSpacing: 0.55,
      aisleCols: [12, 28, 44, 60],
      edgePaddingX: 2,
      midGapAuto: true,
    });
    seats.name = `Seats_${side}`;

    const roofGeo = new THREE.BoxGeometry(standXLen + 10, 0.7, standD + 3);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      side: THREE.DoubleSide,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.name = `Roof_${side}`;
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.position.set(0, standH + 6.5, body.position.z + zDir * 1.4);

    const beams = new THREE.Group();
    beams.name = `Beams_${side}`;

    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, standD + 6, 10);
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      side: THREE.DoubleSide,
    });

    for (let i = -5; i <= 5; i++) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.z = Math.PI / 2;
      beam.position.set(i * 10, roof.position.y - 0.4, roof.position.z);
      beams.add(beam);
    }

    return { body, seats, roof, beams };
  }

  const north = buildLongStand("north");
  stadium.add(north.body, north.seats, north.roof, north.beams);

  const south = buildLongStand("south");
  stadium.add(south.body, south.seats, south.roof, south.beams);


    // =========================
  // IMPORT MODELS: Floodlights + Dugouts
  // =========================
  try {
    const flood = await loadGLTF("/models/floodlight.glb");
    flood.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    const positions = [
      [-70, 0, -50],
      [ 70, 0, -50],
      [-70, 0,  50],
      [ 70, 0,  50],
    ];

    positions.forEach(([x, y, z]) => {
      const f = flood.clone(true);
      f.position.set(x, y, z);
      f.scale.set(6, 6, 6);
      stadium.add(f);

      // SpotLight afër çdo floodlight (lighting + shadows)
      const spot = new THREE.SpotLight(0xffffff, 1.6, 260, Math.PI / 7, 0.35, 1);
      spot.position.set(x, 35, z);
      spot.target.position.set(0, 0, 0);
      spot.castShadow = true;
      spot.shadow.mapSize.width = 1024;
      spot.shadow.mapSize.height = 1024;
      stadium.add(spot);
      stadium.add(spot.target);
    });

    const dugout = await loadGLTF("/models/dugout.glb");
    dugout.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    // 2 dugouts near midfield
    const d1 = dugout.clone(true);
    d1.position.set(0, 0, pitchD / 2 + 6);
    d1.rotation.y = Math.PI;
    d1.scale.set(3.5, 3.5, 3.5);
    stadium.add(d1);

    const d2 = dugout.clone(true);
    d2.position.set(0, 0, -(pitchD / 2 + 6));
    d2.rotation.y = 0;
    d2.scale.set(3.5, 3.5, 3.5);
    stadium.add(d2);

  } catch (e) {
    console.warn("Model load failed:", e);
  }


  // =========================
  // FUNDET (mure)
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
