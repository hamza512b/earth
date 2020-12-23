
import * as THREE from "three";
import config from "../../config";

const earthGeometry = new THREE.SphereGeometry(config.earthRadius || 2, 32, 32);
const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x71a7ef });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);

export default earth;
