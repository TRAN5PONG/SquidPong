type Vector3 = { x: number; y: number; z: number };
type Size3D = { width: number; height: number; length: number };

export const constants = {
  TABLE: {
    position: { x: 0, y: 2.2, z: 0 } as Vector3,
    size: {
      width: 4.53740119934082,
      height: 0.10306572914123535,
      length: 8.179262161254883,
    } as Size3D,
  },
  AIR_DENSITY: 1.225, // kg/m^3
  BALL: {
    position: { x: 0, y: 4, z: 2 } as Vector3,
    radius: 0.2 / 2,

    diameter: 0.2,
  },
  FLOOR: {
    position: { x: 0, y: 0.1, z: 0 } as Vector3,
    size: { width: 40, height: 0.1, length: 40 } as Size3D,
  },
  PADDLE: {
    size: { width: 0.4, height: 0.35, length: 0.15 } as Size3D,
    position: {
      left: { x: 0, y: 2, z: 4 } as Vector3,
      right: { x: 0, y: 2, z: 4 } as Vector3,
    },
  },
  NET: {
    size: {
      width: 3.562144637107849,
      height: 0.2788057327270508,
      length: 3.264338488406793e-7,
    } as Size3D,
    position: { x: 0, y: 1.7115225791931152, z: 0 } as Vector3,
  },
  Gravity: {
    x: 0,
    y: -9.81,
    z: 0,
  } as Vector3,
};

