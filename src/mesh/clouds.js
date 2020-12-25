
import * as THREE from "three";
import config from "../../config";

const TextureLoader = new THREE.TextureLoader;

const loadClouds = () => new Promise(async (resolve, reject) => {
    const cloudsGeometry = new THREE.SphereGeometry((config.earthsRadius || 2) * 1.005, 32, 32);
    const cloudsMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff });

    const cloudsTexture = await TextureLoader.loadAsync("./textures/Clouds.jpg");
    cloudsMaterial.alphaMap = cloudsTexture;
    cloudsMaterial.transparent = true;
    cloudsMaterial.depthWrite = false;

    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);

    resolve(clouds)
});

export default loadClouds;
