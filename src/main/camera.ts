import * as THREE from "three";

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
// camera.position.z = config.cameraFar || 5;
camera.position.z = 15;
camera.fov = 30;
camera.lookAt(0, 0, 0);

export default camera;
