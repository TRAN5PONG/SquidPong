type Vector3 = { x: number; y: number; z: number };
type Size3D = { width: number; height: number; length: number };

export const constants = {
  TABLE: {
    position: { x: 0, y: 2.26, z: 0 } as Vector3,
    size: {
      width: 4.53740119934082,
      height: 0.10306572914123535,
      length: 8.179262161254883,
    } as Size3D,
  },
  AIR_DENSITY: 1.225, // kg/m^3
  BALL: {
    position: { x: 0, y: 4, z: 2 } as Vector3,
    radius: 0.18 / 2,

    diameter: 0.18,
  },
  FLOOR: {
    position: { x: 0, y: 0.1, z: 0 } as Vector3,
    size: { width: 40, height: 0.1, length: 40 } as Size3D,
  },
  PADDLE: {
    size: { width: 0.8, height: 0.6, length: 0.2 } as Size3D,
    position: {
      x: 0,
      y: 4,
      z: 0,
    } as Vector3,
  },
  NET: {
    size: {
      width: 5.4,
      height: 0.41,
      length: 0.0000011175870895385742,
    } as Size3D,
    position: { x: 0, y: 2.58, z: 0 } as Vector3,
  },
  Gravity: {
    x: 0,
    y: -9.81,
    z: 0,
  } as Vector3,
};
