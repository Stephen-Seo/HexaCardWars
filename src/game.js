"use strict";

import * as THREE from "./threejs/Three.js";
import { GLTFLoader } from "./threejs/addons/loaders/GLTFLoader.js";
import { Timer } from "./threejs/addons/misc/Timer.js";

import { Hexagon, hex_from_pixel } from "./hex.js";

const scene = new THREE.Scene();

// Timer setup.
const timer = new Timer();

// Camera view setup.
let ratio = window.innerWidth / window.innerHeight;
const unit = 6;
let width = ratio > 1 ? ratio * unit : unit;
let height = ratio > 1 ? unit : unit / ratio;

const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, height / -2, 1, 10);
// DEBUG
//window.globalCamera = camera;

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
camera.position.y = 3;
camera.position.z = 7;
camera.lookAt(0, 0, 0);

const CAMERA_ORBIT_RADIUS = 7.0;
const CAMERA_ORBIT_RATE = 0.3;
let camera_orbit_radians = 0;

function orbit_camera_update() {
  camera_orbit_radians += CAMERA_ORBIT_RATE * timer.getDelta();
  if (camera_orbit_radians > 2.0 * Math.PI) {
    camera_orbit_radians -= 2.0 * Math.PI;
  }

  camera.position.z = Math.cos(camera_orbit_radians) * CAMERA_ORBIT_RADIUS;
  camera.position.x = Math.sin(camera_orbit_radians) * CAMERA_ORBIT_RADIUS;
  camera.lookAt(0, 0, 0);
}

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
const hexagon_count = 7;
let hexagon = undefined;
let hexagon_instanced_mesh = undefined;
let dummy = new THREE.Object3D();

gltf_loader.load(
  '/res/hexagon.glb',
  function ( gltf ) {
    hexagon = gltf.scene;
    // DEBUG
//    window.globalHexagon = hexagon;
    // scene.add( gltf.scene );
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
function animate(timestamp) {
  requestAnimationFrame(animate);

  timer.update(timestamp);

  if (hexagon !== undefined && hexagon_instanced_mesh === undefined) {
    hexagon_instanced_mesh = new THREE.InstancedMesh(hexagon.children[0].geometry, hexagon.children[0].material, hexagon_count);
    hexagon_instanced_mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Center hex.
    let hexagon_hex = new Hexagon(0, 0);
    let hexagon_pos = hexagon_hex.to_pixel(1);
    dummy.position.set(hexagon_pos.x, 0, hexagon_pos.y);
    dummy.updateMatrix();
    hexagon_instanced_mesh.setMatrixAt(0, dummy.matrix);

    // Layer 1 ring hexes.
    let ring_hexagons = hexagon_hex.ring(1);
    for (let i = 0; i < ring_hexagons.length; ++i) {
      if (i + 1 < hexagon_count) {
        hexagon_pos = ring_hexagons[i].to_pixel(1);
        dummy.position.set(hexagon_pos.x, 0, hexagon_pos.y);
        dummy.updateMatrix();
        hexagon_instanced_mesh.setMatrixAt(i + 1, dummy.matrix);
      }
    }

    scene.add(hexagon_instanced_mesh);
  }

  orbit_camera_update();

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
