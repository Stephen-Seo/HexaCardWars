"use strict";

import * as THREE from "./threejs/Three.js";

const scene = new THREE.Scene();

let ratio = window.innerWidth / window.innerHeight;
const unit = 4;
let width = ratio > 1 ? ratio * unit : unit;
let height = ratio > 1 ? unit : unit / ratio;

const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, height / -2, 1, 10);

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

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00FF77 });

// Mouse input
const raycaster = new THREE.Raycaster();
let is_mouseclick = false;
let mouse_pos = new THREE.Vector2(0, 0);
window.addEventListener("mousedown", (_event) => { is_mouseclick = true; });
window.addEventListener("pointermove", (event) => {
  mouse_pos.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse_pos.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera['position'].z = 5;

function animate() {
  requestAnimationFrame(animate);

  cube['rotation'].x += 0.01;
  cube['rotation'].y += 0.01;

  renderer.render(scene, camera);

  if (is_mouseclick) {
    is_mouseclick = false;
    raycaster.setFromCamera(mouse_pos, camera);
    const intersect = raycaster.intersectObject(cube);
    if (intersect.length != 0) {
      console.log("Clicked on cube.");
    }
  }
}

animate();

// vim: et, sw=2, ts=2
