import * as THREE from "three";

// ImageBitmapLoader decodes JPGs off the main thread (in a worker), so the
// large earth textures no longer block/jank the loading spinner animation the
// way TextureLoader's main-thread <img> decode does.
const bitmapLoader = new THREE.ImageBitmapLoader();
bitmapLoader.setOptions({ imageOrientation: "flipY" });

async function loadTexture(url: string) {
  const bitmap = await bitmapLoader.loadAsync(url);
  return new THREE.CanvasTexture(bitmap);
}

async function loadEarth() {
  const earthGeometry = new THREE.SphereGeometry(2, 77, 77);
  const earthMaterial = new THREE.MeshPhysicalMaterial({ color: 0x71a7ef });

  // Fetch + decode all three textures in parallel instead of serially.
  const [albedoTexture, roughnessTexture, emissionTexture] = await Promise.all([
    loadTexture("./textures/Albedo.jpg"),
    loadTexture("./textures/Roughness.jpg"),
    loadTexture("./textures/Emission.jpg"),
  ]);

  earthMaterial.map = albedoTexture;

  earthMaterial.roughnessMap = roughnessTexture;
  // earthMaterial.clearcoat = 1;
  // earthMaterial.clearcoatRoughness = 0.7;

  earthMaterial.emissiveMap = emissionTexture;
  earthMaterial.emissive = new THREE.Color(222, 169, 6);
  earthMaterial.emissiveIntensity = 0.0001;

  // earthMaterial.refractionRatio = 1.45;
  return new THREE.Mesh(earthGeometry, earthMaterial);
}

export default loadEarth;
