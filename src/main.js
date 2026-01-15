import scene from './core/scene.js';
import camera from './core/camera.js';
import renderer from './core/renderer.js';
import { setupResize } from './utils/resize.js';
import { createStadium } from './world/stadium.js';



import * as THREE from 'three';
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(5, 10, 7);
dir.castShadow = true;
scene.add(dir);


const stadium = createStadium();
scene.add(stadium);



setupResize(camera, renderer);


function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
