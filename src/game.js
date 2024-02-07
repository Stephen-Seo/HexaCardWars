"use strict";

import * as THREE from "./threejs/Three.js";
import { GLTFLoader } from "./threejs/addons/loaders/GLTFLoader.js";
import { Timer } from "./threejs/addons/misc/Timer.js";

import { Hexagon, hex_from_pixel } from "./hex.js";
import { cube_lerp } from "./utils.js";

const scene = new THREE.Scene();

// Other constants.
const white = new THREE.Color().setHex(0xFFFFFF);
const light_green = new THREE.Color().setHex(0x88FF88);

// Timer setup.
const timer = new Timer();

// Camera view setup.
let ratio = window.innerWidth / window.innerHeight;
const unit = 6;
let width = ratio > 1 ? ratio * unit : unit;
let height = ratio > 1 ? unit : unit / ratio;

const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, height / -2, 1, 20);
// DEBUG
//window.globalCamera = camera;

let camera_target = {
  "sta_x": 0,
  "sta_y": 0,
  "sta_z": 0,
  "end_x": 0,
  "end_y": 0,
  "end_z": 0,
  "amount": 0,
  "get_x": function () {
    if (this.amount >= 1.0) {
      return this.end_x;
    } else if (this.amount <= 0.0) {
      return this.sta_x;
    } else {
      return cube_lerp(this.sta_x, this.end_x, this.amount);
    }
  },
  "get_y": function () {
    if (this.amount >= 1.0) {
      return this.end_y;
    } else if (this.amount <= 0.0) {
      return this.sta_y;
    } else {
      return cube_lerp(this.sta_y, this.end_y, this.amount);
    }
  },
  "get_z": function () {
    if (this.amount >= 1.0) {
      return this.end_z;
    } else if (this.amount <= 0.0) {
      return this.sta_z;
    } else {
      return cube_lerp(this.sta_z, this.end_z, this.amount);
    }
  },
  "set_x": function (v) {
    this.sta_x = this.end_x;
    this.end_x = v;
    this.amount = 0.0;
  },
  "set_y": function (v) {
    this.sta_y = this.end_y;
    this.end_y = v;
    this.amount = 0.0;
  },
  "set_z": function (v) {
    this.sta_z = this.end_z;
    this.end_z = v;
    this.amount = 0.0;
  },
  "set_pos": function (x, y, z) {
    this.sta_x = this.get_x();
    this.sta_y = this.get_y();
    this.sta_z = this.get_z();

    this.end_x = x;
    this.end_y = y;
    this.end_z = z;

    this.amount = 0.0;
  },
  "rate": 1.0,
  "update": function () {
    if (this.amount < 1.0) {
      this.amount += this.rate * timer.getDelta();
    }
  }
};

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
  camera.lookAt(camera_target.get_x(), camera_target.get_y(), camera_target.get_z());
  camera.updateProjectionMatrix();
});

camera.position.x = 0;
camera.position.y = 6;
camera.position.z = 10;
camera.lookAt(camera_target.get_x(), camera_target.get_y(), camera_target.get_z());

const CAMERA_ORBIT_RADIUS = 10.0;
const CAMERA_ORBIT_RATE = 0.1;
let camera_orbit_radians = 0;

function orbit_camera_update() {
  camera_orbit_radians += CAMERA_ORBIT_RATE * timer.getDelta();
  if (camera_orbit_radians > 2.0 * Math.PI) {
    camera_orbit_radians -= 2.0 * Math.PI;
  }

  camera.position.z = Math.cos(camera_orbit_radians) * CAMERA_ORBIT_RADIUS;
  camera.position.x = Math.sin(camera_orbit_radians) * CAMERA_ORBIT_RADIUS;
  camera.lookAt(camera_target.get_x(), camera_target.get_y(), camera_target.get_z());
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
const hexagon_count = 37;
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
const light = new THREE.AmbientLight(0xFFFFFF, 3);
scene.add(light);

// Main animation loop.
function animate(timestamp) {
  requestAnimationFrame(animate);

  timer.update(timestamp);

  if (hexagon !== undefined && hexagon_instanced_mesh === undefined) {
    hexagon_instanced_mesh = new THREE.InstancedMesh(hexagon.children[0].geometry, hexagon.children[0].material, hexagon_count);
    hexagon_instanced_mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Setup instanced mesh with hexagons.
    let hexagon_hex = new Hexagon(0, 0);
    let spiral_hexagons = hexagon_hex.spiral(3);
    for (let i = 0; i < spiral_hexagons.length; ++i) {
      if (i < hexagon_count) {
        let hexagon_pos = spiral_hexagons[i].to_pixel(1);
        dummy.position.set(hexagon_pos.x, 0, hexagon_pos.y);
        dummy.updateMatrix();
        hexagon_instanced_mesh.setMatrixAt(i, dummy.matrix);
      } else {
        console.log("WARNING: instanced mesh setup with too high index: " + i + "!");
      }
    }

    scene.add(hexagon_instanced_mesh);
  }

  orbit_camera_update();

  if (hexagon_instanced_mesh !== undefined) {
    // Color to white before raycast.
    for (let i = 0; i < hexagon_count; ++i) {
      hexagon_instanced_mesh.setColorAt(i, white);
    }
    // Raycast onto instances.
    raycaster.setFromCamera(mouse_pos, camera);
    const intersection = raycaster.intersectObject(hexagon_instanced_mesh);
    for (let i = 0; i < intersection.length; ++i) {
      const interId = intersection[i].instanceId;
      if (is_mouseclick) {
        is_mouseclick = false;
        // DEBUG
        //console.log("intersection point: " + intersection[i].point.x + ", " + intersection[i].point.z);
        let clicked_hexagon = hex_from_pixel(intersection[i].point.x,
                                             intersection[i].point.z,
                                             1).to_int_hex();

        // DEBUG
        //console.log("clicked_hexagon: " + clicked_hexagon.x + ", " + clicked_hexagon.z);
        let hexagon_pos = clicked_hexagon.to_pixel(1);
        // DEBUG
        //console.log("pos: " + hexagon_pos.x + ", " + hexagon_pos.y);
        camera_target.set_pos(hexagon_pos.x, 0, hexagon_pos.y);
      }
      hexagon_instanced_mesh.setColorAt(interId, light_green);
    }
    hexagon_instanced_mesh.instanceColor.needsUpdate = true;
  }

  camera_target.update();

  renderer.render(scene, camera);
}

animate();

// vim: et sw=2 ts=2 sts=2
