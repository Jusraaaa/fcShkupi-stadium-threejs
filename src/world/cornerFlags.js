// src/world/cornerFlags.js
import * as THREE from "three";

/**
 * Krijon një texture procedurale (checker) për flamurin
 * -> shmang nevojën për image file
 * -> gjithmonë e disponueshme edhe në deploy (Vercel)
 */
function makeCheckerTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");

  const blue = "#0b4db3";   // blu (klub)
  const white = "#ffffff"; // bardh
  const size = 32;         // madhësia e katrorëve

  for (let y = 0; y < c.height; y += size) {
    for (let x = 0; x < c.width; x += size) {
      const isBlue = ((x / size + y / size) % 2) === 0;
      ctx.fillStyle = isBlue ? blue : white;
      ctx.fillRect(x, y, size, size);
    }
  }

  // Border i lehtë për definim vizual
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, c.width - 6, c.height - 6);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  return tex;
}

/**
 * Krijon një flamur të vetëm (shtyllë + cloth)
 * Flamuri ka animacion procedural që simulon erën
 */
function makeOneFlag() {
  const g = new THREE.Group();

  // =========================
  // Shtylla
  // =========================
  const poleH = 3.2;
  const poleGeo = new THREE.CylinderGeometry(0.035, 0.045, poleH, 10);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xe9eef6,
    roughness: 0.6,
    metalness: 0.15,
  });

  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = poleH / 2;
  pole.castShadow = true;
  pole.receiveShadow = true;
  g.add(pole);

  // Tip poshtë (detaj vizual)
  const tipGeo = new THREE.ConeGeometry(0.05, 0.22, 10);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.0,
  });

  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.y = 0.08;
  tip.castShadow = true;
  g.add(tip);

  // =========================
  // Cloth (flamuri)
  // =========================
  const flagW = 0.85;
  const flagH = 0.55;
  const segW = 18;
  const segH = 8;

  // Plane me segmente për animacion të butë
  const flagGeo = new THREE.PlaneGeometry(flagW, flagH, segW, segH);
  const tex = makeCheckerTexture();

  const flagMat = new THREE.MeshStandardMaterial({
    map: tex,
    side: THREE.DoubleSide,
    roughness: 0.75,
    metalness: 0.0,
  });

  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.castShadow = true;
  flag.receiveShadow = true;

  // Vendosja pranë majës së shtyllës
  flag.position.set(flagW / 2 + 0.06, poleH - 0.35, 0);
  g.add(flag);

  // Ruaj pozicionet origjinale (base) për animacion
  const pos = flagGeo.attributes.position;
  const base = new Float32Array(pos.array.length);
  base.set(pos.array);

  /**
   * update(time)
   * -> thirret çdo frame
   * -> simulon valë të lehtë ere
   *
   * PERFORMANCE:
   * - nuk përdor computeVertexNormals() çdo frame
   * - mjaftueshëm realist për cloth të vogël
   */
  g.userData = {
    update(time) {
      for (let i = 0; i < pos.count; i++) {
        const ix = i * 3;
        const x = base[ix + 0];
        const y = base[ix + 1];

        // Sa më larg nga shtylla, aq më shumë lëvizje
        const t = x / flagW;

        const wave =
          Math.sin(time * 2.1 + x * 7.0) * 0.10 * t +
          Math.cos(time * 1.6 + y * 9.0) * 0.03 * t;

        pos.array[ix + 2] = base[ix + 2] + wave;
      }

      pos.needsUpdate = true;
    },
  };

  return g;
}

/**
 * Krijon 4 flamujt e këndeve të fushës
 * -> me orientim korrekt sipas fushës
 */
export function createCornerFlags(pitchW = 105, pitchD = 68) {
  const group = new THREE.Group();
  group.name = "CornerFlags";

  const inset = 0.6; // pak mbrenda vijës
  const y = 0.02;

  const corners = [
    { x: +pitchW / 2 - inset, z: +pitchD / 2 - inset, ry: Math.PI },       // SE
    { x: +pitchW / 2 - inset, z: -pitchD / 2 + inset, ry: Math.PI / 2 },   // NE
    { x: -pitchW / 2 + inset, z: +pitchD / 2 - inset, ry: -Math.PI / 2 },  // SW
    { x: -pitchW / 2 + inset, z: -pitchD / 2 + inset, ry: 0 },             // NW
  ];

  const flags = corners.map((c) => {
    const f = makeOneFlag();
    f.position.set(c.x, y, c.z);
    f.rotation.y = c.ry;
    return f;
  });

  flags.forEach((f) => group.add(f));

  // Update i centralizuar për të gjithë flamujt
  group.userData = {
    t: 0,
    update(dt) {
      group.userData.t += dt;
      for (const f of flags) {
        f.userData.update(group.userData.t);
      }
    },
  };

  return group;
}
