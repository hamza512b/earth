import * as THREE from "three";

const size = 100;
const divisions = 2;
const colorCenterLine = 0xffffff;
const colorGrid = 0x0;
const gridHelper = new THREE.GridHelper( size, divisions, colorCenterLine, colorGrid);
export default gridHelper;