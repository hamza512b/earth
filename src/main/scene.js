import * as THREE from "three";
import config from "../../config";

const scene = new THREE.Scene();
scene.background = new THREE.Color(config.background || 0x0);

export default scene;