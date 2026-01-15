import * as THREE from 'three';

// Krijon një “karrikë” të thjeshtë (seat + backrest)
export function createSeat(color = 0x1e3a8a) {
  const seatGroup = new THREE.Group();
  seatGroup.name = 'seat';

  const material = new THREE.MeshStandardMaterial({ color });

  // ulësja
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.4), material);
  seat.position.set(0, 0.06, 0);
  seat.castShadow = true;
  seatGroup.add(seat);

  // mbështetësja e shpinës
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.08), material);
  back.position.set(0, 0.25, -0.16);
  back.castShadow = true;
  seatGroup.add(back);

  return seatGroup;
}
