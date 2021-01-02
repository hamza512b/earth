
import * as THREE from "three";
import config from "../../config";

const loadAtmosphere = () => new Promise(async (resolve, reject) => {
    const atmoGeometry = new THREE.SphereGeometry((config.earthsRadius || 2) * 1.009, 32, 32);
    const atmoMaterial = new THREE.MeshPhysicalMaterial({ color: 0x0000ff });

    atmoMaterial.opacity = 0.1;
    atmoMaterial.emissive = new THREE.Color(0x0000ff);
    atmoMaterial.transparent = true;
    atmoMaterial.depthWrite = false;

    const clouds = new THREE.Mesh(atmoGeometry, atmoMaterial);

    resolve(clouds)
});

export default loadAtmosphere;
