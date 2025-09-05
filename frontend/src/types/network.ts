export interface oponent {
  x: number;
  y: number;
  z: number;
}

export interface ball {
  x: number;
  y: number;
  z: number;

  timestamp: number;

  velocityX: number;
  velocityY: number;
  velocityZ: number;

  targetX: number;
  targetY: number;
  targetZ: number;
}
