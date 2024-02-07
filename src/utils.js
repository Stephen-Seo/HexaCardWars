"use strict";

function lerp(a, b, amount) {
    return (1.0 - amount) * a + amount * b;
}

export { lerp }
