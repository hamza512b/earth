
import * as THREE from "three";
import config from "../../config";

const TextureLoader = new THREE.TextureLoader;

const loadEarth = () => new Promise(async (resolve, reject) => {
    const earthGeometry = new THREE.SphereGeometry(config.earthRadius || 2, 32, 32);
    const earthMaterial = new THREE.MeshPhysicalMaterial({ color: 0x71a7ef });

    const albedoTexture = await TextureLoader.loadAsync("./textures/Albedo.png");
    earthMaterial.map = albedoTexture;

    const roughnessTexture = await TextureLoader.loadAsync("./textures/Roughness.png");
    earthMaterial.roughnessMap = roughnessTexture;
    earthMaterial.clearcoat = 1;
    earthMaterial.clearcoatRoughness = .7;

    const emissionTexture = await TextureLoader.loadAsync("./textures/Emission.png")
    earthMaterial.emissiveMap = emissionTexture;
    earthMaterial.emissive = new THREE.Color(222, 169, 6);
    earthMaterial.emissiveIntensity = config.emmision || 0.001;


    earthMaterial.refractionRatio = 1.45;
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);

    resolve(earth)
});

export default loadEarth;
