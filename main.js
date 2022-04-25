// Threejs
import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls"

// Canvas
const canvas = document.querySelector("#c");


// Cameras
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 5;
camera.lookAt(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.bias = 0.0001;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0);

// Light
const light = new THREE.DirectionalLight(0x8888FF, 5);
light.castShadow = true;
light.shadow.camera.near = 0.1;
light.shadow.camera.far = 8;
light.position.set(0, 0, 4);
light.lookAt(0, 0, 0);
light.shadow.mapSize = new THREE.Vector2(1024, 1024);


//Earth, clouds, atmosphere
let objects = [];
Promise.all([loadEarth(), loadClouds(), loadAtmosphere()])
    .then(objs => objects = objs)
    .catch(err => console.log(err))
    .finally(() => main());


let earth, clouds, atmosphere;
function main() {
    earth = objects[0];
    clouds = objects[1];
    atmosphere = objects[2];

    // Add Stuff
    scene.add(light);
    scene.add(earth);
    scene.add(clouds);
    scene.add(atmosphere);
    
    // Event listners
    window.addEventListener("resize", () => {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        renderer.render(scene, camera);
    });

    animate();
}


// Display
const orbit = new OrbitControls(camera, canvas);
orbit.enableDamping = true;
orbit.rotateSpeed = 0.25;
orbit.enablePan = false;
orbit.maxDistance = 10;
orbit.minDistance = 4;

// Start animation
const animate = () => {
    earth.rotation.y += 0.0002;
    clouds.rotation.y -= 0.0005;

    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    orbit.update();
};

function loadAtmosphere() {
  return new Promise(async (resolve, reject) => {
    const atmoGeometry = new THREE.SphereGeometry(2 * 1.009, 32, 32);
    const atmoMaterial = new THREE.MeshPhysicalMaterial({ color: 0x0000ff });

    atmoMaterial.opacity = 0.1;
    atmoMaterial.emissive = new THREE.Color(0x0000ff);
    atmoMaterial.transparent = true;
    atmoMaterial.depthWrite = false;

    const clouds = new THREE.Mesh(atmoGeometry, atmoMaterial);
    
    resolve(clouds);
  });
}

function loadClouds() {
  return new Promise(async (resolve, reject) => {
    const TextureLoader = new THREE.TextureLoader;
    const cloudsGeometry = new THREE.SphereGeometry(2 * 1.005, 32, 32);
    const cloudsMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff });

    const cloudsTexture = await TextureLoader.loadAsync("/Clouds.jpg");
    cloudsMaterial.alphaMap = cloudsTexture;
    cloudsMaterial.transparent = true;
    cloudsMaterial.depthWrite = false;

    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);

    resolve(clouds);
  });
}


function loadEarth() {
  return new Promise(async (resolve, reject) => {
    const TextureLoader = new THREE.TextureLoader;

    const earthGeometry = new THREE.SphereGeometry(2, 32, 32);
    const earthMaterial = new THREE.MeshPhysicalMaterial({ color: 0x71a7ef });

    const albedoTexture = await TextureLoader.loadAsync("/Albedo.jpg");
    earthMaterial.map = albedoTexture;

    const roughnessTexture = await TextureLoader.loadAsync("/Roughness.jpg");
    earthMaterial.roughnessMap = roughnessTexture;
    earthMaterial.clearcoat = 1;
    earthMaterial.clearcoatRoughness = .7;

    const emissionTexture = await TextureLoader.loadAsync("/Emission.jpg");
    earthMaterial.emissiveMap = emissionTexture;
    earthMaterial.emissive = new THREE.Color(222, 169, 6);
    earthMaterial.emissiveIntensity = 0.001;


    earthMaterial.refractionRatio = 1.45;
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);

    resolve(earth);
  });
}

export default loadEarth;
