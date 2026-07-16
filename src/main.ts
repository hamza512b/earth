// Main
import renderer from "./main/renderer";
import camera from "./main/camera";
import light from "./main/light";

// Meshes
import loadEarth from "./mesh/earth";
import loadAtmosphere from "./mesh/atmosphere";
import "./sounds";
import { playSound, sounds } from "./sounds";
import * as THREE from "three";
import { inject } from "@vercel/analytics";
import { OrbitControls } from "three/examples/jsm/Addons.js";

// Vercel Web Analytics
inject();

// Helpers
// import helpers from "./helpers";
// scene.add(helpers);

// Nodes
const spinner = document.querySelector("#spinner")!;
const startInfo = document.querySelector("#start")!;
const canvas = document.querySelector("canvas")!;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0);

// Main
//Earth, clouds, atmosphere
const objects = await Promise.all([loadEarth(), loadAtmosphere()]);

const [earth, atmosphere] = objects;

const button = document.querySelector("button#start");
function main() {
  scene.add(light);
  objects.forEach((obj) => scene.add(obj));

  // Event listners
  window.addEventListener("resize", () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  });

  // Display
  spinner.remove();
  playScene();

  button?.addEventListener("click", () => {
    startInfo.remove();
    playSound();
  });
}

// Display
const control = new OrbitControls(camera, canvas);
control.rotateSpeed = 0.5;
control.enablePan = false;
control.dampingFactor = 0.1;
control.enableDamping = true;
control.maxDistance = 10;
control.minDistance = 4;

// Start animation
const cloudsMaterial = atmosphere.material as THREE.ShaderMaterial;
const playScene = () => {
  earth.rotation.y += 0.0002;
  // atmosphere.rotation.y -= 0.0005;
  // atmosphere.rotation.z -= 0.00025;
  cloudsMaterial.uniforms.uTime.value += 1;

  control.update();
  renderer.render(scene, camera);
  requestAnimationFrame(playScene);
};
main();
