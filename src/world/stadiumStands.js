// src/world/stadiumStands.js
import * as THREE from "three";
import { createSeatsForLongStand } from "./seats.js";

export async function createLongStands({
  pitchW,
  pitchD,
  standH,
  standXLen,
  standD,
  standGapFromPitch,
  USE_STAND_TEXTURE,
  concrete,
  USE_ROOF_TEXTURE,
  roofDiff,
} = {}) {
  const group = new THREE.Group();
  group.name = "LongStands";

  /**
   * Ndihmës: kthen materialin e tribunës
   * (nëse texture mungon, bie në ngjyrë)
   */
  function makeStandMaterial() {
    if (USE_STAND_TEXTURE && concrete) {
      return new THREE.MeshStandardMaterial({
        map: concrete,
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Ndihmës: kthen materialin e çatisë
   */
  function makeRoofMaterial() {
    if (USE_ROOF_TEXTURE && roofDiff) {
      return new THREE.MeshStandardMaterial({
        map: roofDiff,
        roughness: 0.6,
        metalness: 0.2,
        side: THREE.DoubleSide,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: 0x1b2333,
      roughness: 0.35,
      metalness: 0.65,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Krijon tribunën e gjatë (north/south)
   */
  function buildLongStand(side = "north") {
    const isNorth = side === "north";
    const zDir = isNorth ? -1 : 1; // north = z negativ, south = z pozitiv

    // =========================
    // SHAPE (profil i tribunës)
    // =========================
    // Profil: front i ulët (2.6m), mbrapa i lartë (standH)
    const standShape = new THREE.Shape();
    standShape.moveTo(0, 0);
    standShape.lineTo(standD, 0);
    standShape.lineTo(standD, standH);
    standShape.lineTo(0, 2.6);
    standShape.lineTo(0, 0);

    // Extrude në gjatësi (standXLen)
    const bodyGeo = new THREE.ExtrudeGeometry(standShape, {
      depth: standXLen,
      bevelEnabled: false,
      steps: 1,
    });

    // rrotulloje që “depth” të bëhet në X
    bodyGeo.rotateY(-Math.PI / 2);
    bodyGeo.center(); // origin në mes (na e bën pozicionimin ma të lehtë)

    // =========================
    // BODY (mesh i tribunës)
    // =========================
    const bodyMat = makeStandMaterial();

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.name = `StandBody_${side}`;
    body.castShadow = true;
    body.receiveShadow = true;

    // north e kthen mbrapsht që “faqja” me i pa kah fusha
    body.rotation.y = isNorth ? Math.PI : 0;

    // vendos tribunën mbrapa vijës anësore (jashtë pitch)
    body.position.set(
      0,
      standH / 2,
      zDir * (pitchD / 2 + standGapFromPitch + standD / 2)
    );

    // =========================
    // SEATS (brenda tribunës)
    // =========================
    // i lidhi si child të body -> lëvizin bashkë me tribunën
    const seats = createSeatsForLongStand(body, side, {
      seatRows: 14,
      xSpacing: 1.6,
      zSpacing: 1.0,
      aisleCols: [12, 28, 44, 60],
      edgePaddingX: 2,
      midGapAuto: true,

      // parametrat e slope/pozicionim (si i ke ti)
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
    // ROOF (çatia)
    // =========================
    const roofGeo = new THREE.BoxGeometry(standXLen + 10, 0.7, standD + 3);
    const roofMat = makeRoofMaterial();

    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.name = `Roof_${side}`;
    roof.castShadow = true;
    roof.receiveShadow = true;

    // pozicion roof lokal (brenda body)
    const roofY = standH / 2 + 6.5;
    const roofZLocal = standD / 2 + 2.4;

    roof.position.set(0, roofY, roofZLocal);
    body.add(roof);

    // =========================
    // SUPPORTS (shtyllat e çatisë)
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

    /**
     * ✅ FIX i rëndësishëm:
     * roof.position.z është “local” dhe për anën tjetër, me rotation mundet me t’dok “gabim”.
     * Ne duam shtyllat me qenë fiks nën çati, pra përdorim roof.position.z (local),
     * por e vendosim pa logjika të çuditshme; kjo punon edhe kur body rrotullohet.
     */
    const supportZ = roof.position.z;

    // nga dyshemeja lokale e tribunës deri nën çati
    const bottomY = -standH / 2 + 0.2;
    const topY = roof.position.y - 0.3;
    const postH = Math.max(0.2, topY - bottomY);

    const postGeo = new THREE.CylinderGeometry(0.22, 0.22, postH, 12);

    for (let i = 0; i < postCount; i++) {
      const tt = postCount === 1 ? 0.5 : i / (postCount - 1);
      const x = xMin + tt * (xMax - xMin);

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, bottomY + postH / 2, supportZ);
      post.castShadow = true;
      post.receiveShadow = true;

      supports.add(post);
    }

    body.add(supports);

    // =========================
    // BEAMS (trare) — i shtojmë realisht në scene (ti i kishe gati)
    // =========================
    const beams = new THREE.Group();
    beams.name = `Beams_${side}`;

    const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, standD + 6, 12);
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x3a3f46,
      roughness: 0.18,
      metalness: 1.0,
    });

    // vendos disa trare horizontal përgjatë tribunës
    for (let i = -5; i <= 5; i++) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.z = Math.PI / 2;
      beam.position.set(i * 10, roof.position.y - 0.4, roof.position.z);

      beam.castShadow = true;
      beam.receiveShadow = true;

      beams.add(beam);
    }

    body.add(beams);

    return body;
  }

  // =========================
  // BUILD BOTH SIDES
  // =========================
  const northBody = buildLongStand("north");
  const southBody = buildLongStand("south");

  group.add(northBody, southBody);
  return group;
}
