import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface BallState {
    x: number;
    y: number;
    z: number;
}

export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export type playerSide = -1 | 1 | null;

export interface BallHistory {
    position: Vector3;
    velocity: Vector3;
    spin: Vector3;
    tick: number;
}
export interface BallHitMessage {
    position: Vec3;            // position of the ball at hit time
    velocity: Vec3;             // the velocity you wanted the ball to have after hit
    spin?: Vec3; // Add spin data
    applySpin?: boolean; // Whether to apply spin
    tick: number;                      // tick when the hit happened
};