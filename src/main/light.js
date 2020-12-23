import * as THREE from "three";

const lightGrup = new THREE.Group();

// Direactional Light
export const dirLight = new THREE.DirectionalLight(0xFFFFFF, 6);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 1500;
dirLight.position.set(0, 0, 4);
dirLight.lookAt(0, 0, 0);
dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
lightGrup.add(dirLight);


export default lightGrup;