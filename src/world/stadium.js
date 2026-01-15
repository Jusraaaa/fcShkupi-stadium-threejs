import * as THREE from 'three';
import { createSeat } from './seats.js';


export function createStadium() {
  // PARENT (hierarkia kryesore)
  const stadium = new THREE.Group();
  stadium.name = 'stadiumGroup';

  // CHILD 1: Fusha
  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 12),
    new THREE.MeshStandardMaterial({ color: 0x1f7a3a })
  );
  field.name = 'field';
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  stadium.add(field);

  // CHILD 2: Tribuna (thjesht një “ring” i ulët rreth fushës)
  const stands = new THREE.Mesh(
    new THREE.RingGeometry(12, 18, 64),
    new THREE.MeshStandardMaterial({ color: 0x2c2c2c })
  );
  stands.name = 'stands';
  stands.rotation.x = -Math.PI / 2;
  stands.position.y = 0.02; // pak mbi fushë
  stands.receiveShadow = true;
  stadium.add(stands);

  // === Karrikat rreth tribunës (3 rreshta + pattern bardh/kaltert) ===
const seatsGroup = new THREE.Group();
seatsGroup.name = 'seatsGroup';

const rows = 15;          // sa rreshta me bo
const perRow = 48;       // sa karrike per rresht (rrit/ule sipas performancës)
const baseRadius = 12.6; // afër tribunës
const rowGap = 0.55;     // distanca mes rreshtave
const heightStart = 1.15; // lartësia e rreshtit të parë
const heightGap = 0.20;

for (let r = 0; r < rows; r++) {
  const radius = baseRadius + r * rowGap;
  const y = heightStart + r * heightGap + r * 0.15;


  for (let i = 0; i < perRow; i++) {
    const angle = (i / perRow) * Math.PI * 2;

    // pattern: bardh / kaltert (si shah)
    const isWhite = (i + r) % 2 === 0;
    const color = isWhite ? 0xffffff : 0x1e3a8a;

    const seat = createSeat(color);
    seat.position.set(
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius
    );

    seat.lookAt(0, y, 0);
    seatsGroup.add(seat);
  }
}

stadium.add(seatsGroup);



  // Kthejmë parent-in
  return stadium;
}
