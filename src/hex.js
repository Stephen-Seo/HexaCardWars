"use strict";

import * as THREE from "./threejs/Three.js";
import { lerp as f_lerp, cube_lerp } from "./utils.js"

const sqrt3 = Math.sqrt(3);

const HEXAGON_DIRS = [
  [ 1,  0],
  [ 1, -1],
  [ 0, -1],
  [-1,  0],
  [-1,  1],
  [ 0,  1]
];

const HEXAGON_DIAGS = [
  [ 2, -1],
  [ 1, -2],
  [-1, -1],
  [-2,  1],
  [-1,  2],
  [ 1,  1]
];

class Hexagon {
  constructor(q, r) {
    this.x = q;
    this.z = r;
    this.y = -this.x - this.z;
  }

  to_int_hex() {
    let int_hex = new Hexagon(this.x, this.z);
    int_hex.x = Math.round(int_hex.x);
    int_hex.z = Math.round(int_hex.z);
    int_hex.y = -int_hex.x - int_hex.z;
    return int_hex;
  }

  add_hex(other) {
    return new Hexagon(this.x + other.x, this.z + other.z);
  }

  sub_hex(other) {
    return new Hexagon(this.x - other.x, this.z - other.z);
  }

  mul_scalar(amount) {
    let result_hex = new Hexagon(this.x, this.z);
    result_hex.x *= amount;
    result_hex.y *= amount;
    result_hex.z *= amount;
    return result_hex;
  }

  is_same(q, r) {
    return this.x === q && this.z === r;
  }

  is_same_int(q, r) {
    return Math.round(this.x) === q && Math.round(this.z) === r;
  }

  is_same_hex(other) {
    return this.x === other.x && this.z === other.z;
  }

  is_same_hex_int(other) {
    let self_int_hex = this.to_int_hex();
    let other_int_hex = other.to_int_hex();
    return self_int_hex.x === other_int_hex.x
        && self_int_hex.z === other_int_hex.z;
  }

  is_within(hex_array) {
    for (let i = 0; i < hex_array.length; ++i) {
      if (this.is_same_hex(hex_array[i])) {
        return true;
      }
    }

    return false;
  }

  neighbor(direction) {
    let dir = HEXAGON_DIRS[direction];
    return this.add_hex(new Hexagon(dir[0], dir[1]));
  }

  diag_neighbor(direction) {
    let dir = HEXAGON_DIAGS[direction];
    return this.add_hex(new Hexagon(dir[0], dir[1]));
  }

  distance(other) {
    return (Math.abs(this.x - other.x)
          + Math.abs(this.y + other.y)
          + Math.abs(this.z + other.z)) / 2;
  }

  distance_int(other) {
    return Math.round(this.distance(other));
  }

  lerp(other, amount) {
    let lerped_hex = new Hexagon(0, 0);
    lerped_hex.x = f_lerp(this.x, other.x, amount);
    lerped_hex.y = f_lerp(this.y, other.y, amount);
    lerped_hex.z = f_lerp(this.z, other.z, amount);
    return lerped_hex;
  }

  line(other) {
    let dist = this.distance_int(other);

    let result = [];

    let start = new Hexagon(this.x, this.z);
    start.x +=  0.000001;
    start.y +=  0.000002;
    start.z += -0.000003;

    let end = new Hexagon(other.x, other.z);
    end.x +=  0.000001;
    end.y +=  0.000002;
    end.z += -0.000003;

    for (let i = 0; i <= dist; ++i) {
      let line_hex = start.lerp(end, 1.0 / dist * i).to_int_hex();
      if (result.length === 0
          || !result[result.length - 1].is_same_hex(line_hex)) {
        result.push(line_hex);
      }
    }

    return result;
  }

  range(distance) {
    let result = [];

    let negative_dist = -Math.abs(distance);
    let positive_dist = Math.abs(distance);

    for (let x = negative_dist; x <= positive_dist; ++x) {
      let x_max = Math.max(negative_dist, negative_dist - x);
      let x_min = Math.min(positive_dist, positive_dist - x);
      for (let y = x_max; y <= x_min; ++y) {
        let new_hex = new Hexagon(x, -x - y);
        // TODO refactor this.
        if (!new_hex.is_within(result)) {
          result.push(new_hex);
        }
      }
    }

    return result;
  }

  intersection(other, self_distance, other_distance) {
    let result = [];

    let x_min = Math.max(this.x - self_distance, other.x - other_distance);
    let x_max = Math.min(this.x + self_distance, other.x + other_distance);

    let y_min = Math.max(this.y - self_distance, other.y - other_distance);
    let y_max = Math.min(this.y + self_distance, other.y + other_distance);

    let z_min = Math.max(this.z - self_distance, other.z - other_distance);
    let z_max = Math.min(this.z + self_distance, other.z + other_distance);

    for (let x = x_min; x <= x_max; ++x) {
      for (let y =  Math.max(y_min, -x - z_max);
               y <= Math.min(y_max, -x - z_min);
             ++y) {
        let new_hex = new Hexagon(x, -x - y);
        // TODO refactor this.
        if (!new_hex.is_within(result)) {
          result.push(new_hex);
        }
      }
    }

    return result;
  }

  rotation(center, rotation) {
    if (rotation === 0) {
        return this;
    }

    let result_hex = this.sub_hex(center);

    if (rotation > 0) {
      for (let i = 0; i < rotation; ++i) {
        let result_hex_clone = new Hexagon(result_hex.x, result_hex.z);
        result_hex.x = -result_hex_clone.y;
        result_hex.y = -result_hex_clone.z;
        result_hex.z = -result_hex_clone.x;
      }
    } else { // rotation < 0
      for (let i = 0; i < Math.abs(rotation); ++i) {
        let result_hex_clone = new Hexagon(result_hex.x, result_hex.z);
        result_hex.x = -result_hex_clone.z;
        result_hex.y = -result_hex_clone.x;
        result_hex.z = -result_hex_clone.y;
      }
    }

    return result_hex.add_hex(center);
  }

  ring(radius) {
    let result = [];
    if (radius === 0) {
      result.push(this);
      return result;
    }

    let hex = new Hexagon(this.x, this.z);
    hex = hex.add_hex(new Hexagon(HEXAGON_DIRS[4][0], HEXAGON_DIRS[4][1]).mul_scalar(radius));

    for (let i = 0; i < 6; ++i) {
      for (let j = 0; j < radius; ++j) {
        // TODO Ensure that this check is unnecessary.
        //if (!hex.is_within(result)) {
            result.push(hex);
        //}
        hex = hex.neighbor(i);
      }
    }

    return result;
  }

  spiral(radius) {
    let result = [];
    result.push(this);

    for (let i = 1; i <= radius; ++i) {
      result = result.concat(this.ring(i));
    }

    return result;
  }

  // TODO Implement this if necessary.
  // fov(is_obst_func, radius) {
  // }

  to_pixel(size) {
    return {
      "x": size * (sqrt3 * this.x + sqrt3 / 2.0 * this.z),
      "y": size * 3.0 / 2.0 * this.z
    };
  }
}

function hex_from_pixel(x, y, size) {
  return new Hexagon(
    (sqrt3 / 3.0 * x - y / 3.0) / size,
    2.0 / 3.0 * y / size
  );
}

class HPosition {
  constructor(id, hexagon, hexagon_size) {
    this.id = id;

    let pixel = hexagon.to_pixel(hexagon_size);
    this.x = pixel.x;
    this.y = 0;
    this.z = pixel.y;

    this.selected = false;

    this.sel_min_height = 0.0;
    this.sel_max_height = 0.3;

    this.sel_from = 0;
    this.sel_to = 0;

    this.amount_rate = 1.0;
    this.amount = 0;
    this.end_lerp = true;

    this.dirty = true;
  }

  set_selected (b) {
    this.selected = b;

    this.sel_from = this.y;
    this.sel_to = b ? this.sel_max_height : this.sel_min_height;

    this.amount = 0.0;
    this.end_lerp = false;
  }

  update (delta, inst_mesh, dummyObj) {
    if (!this.end_lerp) {
      this.amount += delta * this.amount_rate;
      this.dirty = true;
      if (this.selected) {
        if (this.amount >= 1.0) {
          this.y = this.sel_max_height;
          this.end_lerp = true;
        } else {
          this.y = cube_lerp(this.sel_from, this.sel_to, this.amount);
        }
      } else {
        if (this.amount >= 1.0) {
          this.y = this.sel_min_height;
          this.end_lerp = true;
        } else {
          this.y = cube_lerp(this.sel_from, this.sel_to, this.amount);
        }
      }
    } // !this.end_lerp

    if (this.dirty) {
      this.dirty = false;

      dummyObj.position.set(this.x, this.y, this.z);
      dummyObj.updateMatrix();
      inst_mesh.setMatrixAt(this.id, dummyObj.matrix);
      inst_mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

class HPositions {
  constructor(hexagons, hexagon_size) {
    this.positions = [];
    for (let i = 0; i < hexagons.length; ++i) {
      this.positions.push(new HPosition(i, hexagons[i], hexagon_size));
    }
    this.dummyObj = new THREE.Object3D();
  }

  get_hex_pos(index) {
    return this.positions[index];
  }

  get_count() {
    return this.positions.length;
  }

  get_hex_x(index) {
    return this.positions[index].x;
  }

  get_hex_y(index) {
    return this.positions[index].y;
  }

  get_hex_z(index) {
    return this.positions[index].z;
  }

  get_matrix(index) {
    this.dummyObj.position.set(this.get_hex_x(index),
                               this.get_hex_y(index),
                               this.get_hex_z(index))
    this.dummyObj.updateMatrix();
    return this.dummyObj.matrix;
  }

  set_selected(index, b) {
    this.positions[index].set_selected(b);
  }

  update(delta, inst_mesh) {
    for (let i = 0; i < this.positions.length; ++i) {
      this.positions[i].update(delta, inst_mesh, this.dummyObj);
    }
  }
}

export { Hexagon, hex_from_pixel, HPosition, HPositions }

// vim: et sw=2 ts=2 sts=2
