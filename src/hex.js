"use strict";

import { lerp as f_lerp } from "./utils.js"

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
        int_hex.x = Math.floor(int_hex.x);
        int_hex.z = Math.floor(int_hex.z);
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
        return Math.floor(this.x) === q && Math.floor(this.z) === r;
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
        return Math.floor(this.distance(other));
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

export { Hexagon, hex_from_pixel }
