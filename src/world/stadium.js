// src/world/stadium.js
import * as THREE from "three";
import { createSeatsForLongStand } from "./seats";
import { createGoals } from "./goals";
import { createPitchLines } from "./pitchLines";





export async function createStadium() 
 {
  const stadium = new THREE.Group();
  stadium.name = "ChairStadium";

  const pitchW = 105;
   const pitchD = 68;


  const margin = 18;
  const standH = 14;

  const standXLen = pitchW + 12;
  const standD = 13;
  const standGapFromPitch = 10;

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
  // TRIBUNAT PA "PARENT GROUP"
  // =========================
  function buildLongStand(side = "north") {
    const zDir = side === "north" ? -1 : 1;

    // Wedge shape (Z,Y)
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

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.name = `StandBody_${side}`;
    body.castShadow = true;
    body.receiveShadow = true;

    // body në world (jo në group)
    body.position.set(
      0,
      standH / 2,
      zDir * (pitchD / 2 + standGapFromPitch + standD / 2)
    );

    // ✅ KARRIGET (lidhen te body, por shtohen direkt në stadium)
    const seats = createSeatsForLongStand(body, side, {
      seatRows: 18,
      xSpacing: 1.05,
      zSpacing: 0.55,
      aisleCols: [12, 28, 44, 60],
      edgePaddingX: 2,
      midGapAuto: true,
    });
    seats.name = `Seats_${side}`;

    // ROOF
    const roofGeo = new THREE.BoxGeometry(standXLen + 10, 0.7, standD + 3);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.name = `Roof_${side}`;
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.position.set(0, standH + 6.5, body.position.z + zDir * 1.4);

    // BEAMS (i mbajmë në një group të vogël vetëm për lehtësi, s’ndikon në seats)
    const beams = new THREE.Group();
    beams.name = `Beams_${side}`;

    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, standD + 6, 10);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x111827 });

    for (let i = -5; i <= 5; i++) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.z = Math.PI / 2;
      beam.position.set(i * 10, roof.position.y - 0.4, roof.position.z);
      beams.add(beam);
    }

    return { body, seats, roof, beams };
  }

  // Shto dy tribunat direkt në stadium
  const north = buildLongStand("north");
  stadium.add(north.body, north.seats, north.roof, north.beams);

  const south = buildLongStand("south");
  
  stadium.add(south.body, south.seats, south.roof, south.beams);

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
