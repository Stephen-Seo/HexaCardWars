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

function updateMouseSelections(mouseSelections,
                               raycaster,
                               mouse_pos,
                               camera,
                               inst_mesh) {
  mouseSelections.reverse();
  mouseSelections[0].length = 0;

  raycaster.setFromCamera(mouse_pos, camera);
  const intersection = raycaster.intersectObject(inst_mesh);
  for (let i = 0; i < intersection.length; ++i) {
    mouseSelections[0].push(intersection[i].instanceId);
  }
}

export { lerp, sq_lerp, cube_lerp, updateMouseSelections }

// vim: et sw=2 ts=2 sts=2
