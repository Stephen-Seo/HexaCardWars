"use strict";

function lerp(a, b, amount) {
    return (1.0 - amount) * a + amount * b;
}

function sq_lerp(a, b, amount) {
    let squared = amount * amount;
    return (1.0 - squared) * a + squared * b;
}

function cube_lerp(a, b, amount) {
    let cubed = amount - 1.0;
    cubed = (cubed * cubed * cubed) + 1.0;
    return (1.0 - cubed) * a + cubed * b;
}

export { lerp, sq_lerp, cube_lerp }
