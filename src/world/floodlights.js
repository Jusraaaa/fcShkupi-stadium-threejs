// src/world/floodlights.js
import * as THREE from "three";

export function createFloodlights({ pitchW = 105, pitchD = 68 } = {}) {
  const g = new THREE.Group();
  g.name = "Floodlights";

  // =========================
  // Pozicionimi i kullave
  // =========================
  const towerH = 34;
  const towerOffsetX = pitchW / 2 + 8;
  const towerOffsetZ = pitchD / 2 + 8;

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.85,
    metalness: 0.15,
  });

  const poleGeo = new THREE.CylinderGeometry(0.5, 0.75, towerH, 18);

  /**
   * Krijon një kullë floodlight
   * Targets janë në WORLD (root) që mos me u deformu drejtimi i dritës
   */
  function makeTower(signX, signZ, root) {
    const t = new THREE.Group();

    // =========================
    // POLE
    // =========================
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = towerH / 2;
    pole.castShadow = true;
    pole.receiveShadow = true;
    t.add(pole);

    // =========================
    // ARM
    // =========================
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(9.5, 0.55, 0.55),
      poleMat
    );
    arm.position.set(-signX * 4.5, towerH - 4.5, 0);
    arm.castShadow = true;
    t.add(arm);

    // =========================
    // PANEL
    // =========================
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, 3.0, 1.6),
      new THREE.MeshStandardMaterial({
        color: 0x0e0e0e,
        roughness: 0.5,
        metalness: 0.25,
      })
    );
    panel.position.set(-signX * 10.0, towerH - 4.5, 0);
    panel.castShadow = true;
    panel.receiveShadow = true;
    t.add(panel);

    // =========================
    // SPOTLIGHTS (ME SHADOWS)
    // =========================
    const baseSpot = new THREE.SpotLight(
      0xffffff,
      0,              // intensity OFF fillimisht
      520,
      Math.PI / 6.2,
      0.25,
      1.0
    );

    const spot1 = baseSpot;
    const spot2 = baseSpot.clone();
    const spot3 = baseSpot.clone();

    spot1.position.set(-signX * 10.7, towerH - 4.5, 0.55);
    spot2.position.set(-signX * 10.7, towerH - 4.5, -0.55);
    spot3.position.set(-signX * 10.7, towerH - 4.2, 0.0);

    // ✅ SHADOWS ON (trend + realism)
    [spot1, spot2, spot3].forEach((s) => {
      s.castShadow = true;
      s.shadow.mapSize.set(1024, 1024);
      s.shadow.bias = -0.00025;     // FIX shadow acne
      s.shadow.radius = 3;          // shadow më i butë (cinematic)
    });

    // =========================
    // TARGETS (WORLD SPACE)
    // =========================
    const target1 = new THREE.Object3D();
    const target2 = new THREE.Object3D();
    const target3 = new THREE.Object3D();

    target1.position.set(0, 0, 0);
    target2.position.set(-signX * pitchW * 0.20, 0, -signZ * pitchD * 0.10);
    target3.position.set(-signX * pitchW * 0.05, 0, signZ * pitchD * 0.20);

    root.add(target1, target2, target3);

    spot1.target = target1;
    spot2.target = target2;
    spot3.target = target3;

    t.add(spot1, spot2, spot3);

    // =========================
    // BULB (emissive – shihet natën)
    // =========================
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.0,
      roughness: 0.2,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    const bulb = new THREE.Mesh(
      new THREE.PlaneGeometry(6.0, 2.6),
      bulbMat
    );
    bulb.position.set(-signX * 8.2, towerH - 4.5, 1.05);
    bulb.rotation.y = signX > 0 ? Math.PI : 0;
    t.add(bulb);

    // =========================
    // API
    // =========================
    t.userData = {
      spot1,
      spot2,
      spot3,
      bulbMat,
      setOn(on) {
        if (on) {
          spot1.intensity = 50.5;
          spot2.intensity = 50.0;
          spot3.intensity = 50.0;
          bulbMat.emissiveIntensity = 3.5;
        } else {
          spot1.intensity = 0.0;
          spot2.intensity = 0.0;
          spot3.intensity = 0.0;
          bulbMat.emissiveIntensity = 0.1;
        }
      },
    };

    // Pozicioni + orientimi
    t.position.set(signX * towerOffsetX, 0, signZ * towerOffsetZ);
    t.lookAt(0, 0, 0);

    return t;
  }

  // =========================
  // 4 KULLAT
  // =========================
  const t1 = makeTower(+1, +1, g);
  const t2 = makeTower(-1, +1, g);
  const t3 = makeTower(+1, -1, g);
  const t4 = makeTower(-1, -1, g);

  g.add(t1, t2, t3, t4);

  // =========================
  // API globale
  // =========================
  g.userData = {
    towers: [t1, t2, t3, t4],
    setOn(on) {
      for (const t of g.userData.towers) t.userData.setOn(on);
      g.updateMatrixWorld(true);
    },
  };

  // Default OFF
  g.userData.setOn(false);
  return g;
}
