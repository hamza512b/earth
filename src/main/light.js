import * as THREE from "three";

const lightGrup = new THREE.Group();

// Direactional Light
export const sun = new THREE.DirectionalLight(0xFFFFFF, 5);
sun.castShadow = true;
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 8;
sun.position.set(0, 0, 4);
sun.lookAt(0, 0, 0);
sun.shadow.mapSize = new THREE.Vector2(1024, 1024);

// Lens flare 

export default sun;