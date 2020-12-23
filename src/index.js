// Threejs
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Style
import "./assets/style/style.scss"

// Main
import scene from "./main/scene";
import renderer from "./main/renderer"
import camera from "./main/camera"
import light from "./main/light";

// Meshes
import loadEarth from "./mesh/earth"

// Helpers
// import helpers from "./helpers";
// scene.add(helpers);

// Nodes
const spinner = document.querySelector("div.spinner");
const canvas = document.querySelector("canvas");

// Main 
let earth;
loadEarth()
    .then(obj => earth = obj)
    .catch(err => console.log(err))
    .finally(() => main());

function main() {
    // Add Stuff
    scene.add(light);
    scene.add(earth);

    // Event listners
    window.addEventListener("resize", () => {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
    });

    // Display
    renderer.render(scene, camera);
    spinner.remove();

    // Animation
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
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    orbit.update();
};
