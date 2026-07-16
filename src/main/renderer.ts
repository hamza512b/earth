import * as THREE from "three";

const canvas = document.querySelector("canvas")!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// Cap the pixel ratio. High-DPI phones report a devicePixelRatio of 3+, which
// means rendering ~9x the pixels — a major performance hit for no visible gain.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export default renderer;
