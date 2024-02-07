"use strict";

import * as THREE from "./threejs/Three.js";
import { GLTFLoader } from "./threejs/addons/loaders/GLTFLoader.js";

const scene = new THREE.Scene();

// Camera view setup.
let ratio = window.innerWidth / window.innerHeight;
const unit = 4;
let width = ratio > 1 ? ratio * unit : unit;
let height = ratio > 1 ? unit : unit / ratio;

const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, height / -2, 1, 10);
window.globalCamera = camera;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', (_event) => {
  renderer.setSize(window.innerWidth, window.innerHeight);

  ratio = window.innerWidth / window.innerHeight;

  width = ratio > 1 ? ratio * unit : unit;
  height = ratio > 1 ? unit : unit / ratio;

  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = height / -2;
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
});

camera.position.x = 0;
camera.position.y = 5;
camera.position.z = 5;
camera.lookAt(0, 0, 0);

// Mouse input.
const raycaster = new THREE.Raycaster();
let is_mouseclick = false;
let mouse_pos = new THREE.Vector2(0, 0);
window.addEventListener("mousedown", (_event) => { is_mouseclick = true; });
window.addEventListener("pointermove", (event) => {
  mouse_pos.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse_pos.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Load hexagon.
const gltf_loader = new GLTFLoader();
let hexagon = undefined;

gltf_loader.load(
  '/res/hexagon.glb',
  function ( gltf ) {
    hexagon = gltf.scene;
    window.globalHexagon = hexagon;
    scene.add( gltf.scene );
  },
  function ( xhr ) {
  },
  function ( error ) {
  }
);

// Load debug cube.
//const cube_geometry = new THREE.BoxGeometry(1, 1, 1);
//const cube_material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
//
//const cube = new THREE.Mesh(cube_geometry, cube_material);
//cube.position.z = -1;
//scene.add(cube);

// Create light.
const light = new THREE.AmbientLight(0xFFFFFF, 1);
scene.add(light);

// Main animation loop.
function animate() {
  requestAnimationFrame(animate);

  if (hexagon !== undefined) {
//    hexagon.rotation.x += 0.01;
//    hexagon.rotation.y += 0.01;
  }

  renderer.render(scene, camera);

  if (is_mouseclick) {
    is_mouseclick = false;
    raycaster.setFromCamera(mouse_pos, camera);
    if (hexagon !== undefined) {
      const intersect = raycaster.intersectObject(hexagon);
      if (intersect.length != 0) {
        console.log("Clicked on hexagon.");
      }
    }
  }
}

animate();

// vim: et sw=2 ts=2 sts=2
