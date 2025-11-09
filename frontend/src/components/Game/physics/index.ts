import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { constants } from "@/utils/constants";

import { Ball } from "./Ball";
import { Paddle } from "./Paddle";
import { Floor } from "./Floor";
import { Net } from "./Net";
import { Table } from "./Table";

// TEST:import { Paddle } from "../entities/Paddle/GamePaddle";
import { paddle } from "../entities/Paddle/GamePaddle";
export class Physics {
  private world!: RAPIER.World;
  eventQueue: RAPIER.EventQueue = null!;
  public ball!: Ball;
  public paddle!: Paddle;
  public floor!: Floor;
  public net!: Net;
  public table!: Table;

  private ballSpin: Vector3 = new Vector3(0, 0, 0); // Angular velocity in rad/s
  private spinDecay: number = 0.98; // Spin decay factor per tick
  private appySpin: boolean = false;

  // TEST:
  private PaddleMesh: paddle | null = null;
  timestep = 1 / 60;

  // For prevent double hit detection
  public lastHitPlayer: string | null = null;
  private PlayerId: string | null = null;
  // callback
  public onBallPaddleCollision?: (
    ball: RAPIER.RigidBody,
    paddle: RAPIER.RigidBody,
  ) => void;
  public onBallFloorCollision?: (
    ball: RAPIER.RigidBody,
    floor: RAPIER.RigidBody,
  ) => void;
  public onBallNetCollision?: (
    ball: RAPIER.RigidBody,
    net: RAPIER.RigidBody,
  ) => void;
  public onBallTableCollision?: (
    ball: RAPIER.RigidBody,
    table: RAPIER.RigidBody,
  ) => void;

  // last collision detection time
  private lastCollisioDetectionTime: number = 0;

  Impulse: RAPIER.Vector3 | null = null;
  // debug
  public TargetX: number = 0;
  public TargetZ: number = 0;

  constructor() { }

  async init() {
    await RAPIER.init();

    this.world = new RAPIER.World(constants.Gravity);
    this.world.timestep = 1 / 60;
    this.eventQueue = new RAPIER.EventQueue(true);

    // Create entities
    this.table = new Table(this.world);
    this.floor = new Floor(this.world);
    this.net = new Net(this.world);

    this.ball = new Ball(this.world);
    this.paddle = new Paddle(this.world);
  }

  updatePaddle(currPos: Vector3) {
    this.paddle.body.setNextKinematicTranslation({
      x: currPos.x,
      y: currPos.y,
      z: currPos.z,
    });
  }
  queueBallImpulse(impulse: Vector3) {
    this.Impulse = impulse;
  }

  calculateTargetZYVelocity(
    ballPos: RAPIER.Vector,
    paddlePos: RAPIER.Vector,
  ): Vector3 {
    const halfLength = constants.TABLE.size.length / 2;
    const halfWidth = constants.TABLE.size.width / 2;
    const tableSurfaceY =
      constants.TABLE.position.y + constants.TABLE.size.height / 2;
    const gravity = Math.abs(constants.Gravity.y); // positive value

    // --- Compute Z target on opponent side ---
    const safeMargin = 0.4;
    const [zMin, zMax] =
      paddlePos.z > 0
        ? [-halfLength + safeMargin, 0.3 - safeMargin]
        : [0.3 + safeMargin, halfLength - safeMargin];

    const paddleVelocityZ = this.paddle.body.linvel().z * 0.15;
    const targetZ = this.calculateTargetZFromVelocity(
      paddleVelocityZ,
      zMin,
      zMax,
    );
    this.TargetZ = targetZ;

    // --- Compute Y velocity to reach arc height ---
    const minArcHeight = tableSurfaceY + constants.NET.size.height + 0.2;
    const arcHeight = Math.max(minArcHeight, ballPos.y + 0.2);
    const heightGain = Math.max(arcHeight - ballPos.y, 0.3);

    const velocityY = Math.sqrt(2 * gravity * heightGain);
    const timeUp = velocityY / gravity;
    const timeDown = Math.sqrt((2 * (arcHeight - tableSurfaceY)) / gravity);
    const totalFlightTime = timeUp + timeDown;

    // --- Compute Z velocity to reach target Z ---
    const velocityZ = (targetZ - ballPos.z) / totalFlightTime;

    // --- Compute X target and velocity ---
    const minX = -halfWidth + safeMargin;
    const maxX = halfWidth - safeMargin;
    let targetX = this.appySpin
      ? paddlePos.x
      : paddlePos.x + this.paddle.body.linvel().x * 0.05;
    targetX = Math.max(minX, Math.min(maxX, targetX));

    const velocityX = (targetX - ballPos.x) / totalFlightTime;
    this.TargetX = targetX;

    // --- Return final velocity vector ---
    return new Vector3(velocityX, velocityY, velocityZ);
  }

  calculateTargetZFromVelocity(
    paddleVelocityZ: number,
    zMin: number,
    zMax: number,
  ): number {
    const clamped = Math.max(-1, Math.min(1, paddleVelocityZ / 2)); // Normalize to [-1, 1]
    const t = (clamped + 1) / 2; // Map to [0, 1]
    return zMin + t * (zMax - zMin); // Map to [zMin, zMax]
  }

  calculateServeVelocity(
    ballPos: RAPIER.Vector,
    paddlePos: RAPIER.Vector,
  ): Vector3 {
    const halfLength = constants.TABLE.size.length / 2;
    const tableSurfaceY =
      constants.TABLE.position.y + constants.TABLE.size.height / 2;

    const isServerOnRight = paddlePos.z > 0;

    // Simple serve: fixed velocities that work
    const velocityY = 2.5; // Upward velocity (can adjust 2.0-3.0)

    // Z velocity: toward server's side
    // Positive paddle.z (right) needs positive velocityZ
    // Negative paddle.z (left) needs negative velocityZ
    const velocityZ = isServerOnRight ? -3.5 : 3.5; // Adjust 3.0-4.5 for distance

    // X velocity: slight movement (optional)
    const velocityX = paddlePos.x * 0.3; // Follow paddle position slightly

    return new Vector3(velocityX, velocityY, velocityZ);
  }
  // TEST:
  public setPaddleMesh(paddle: paddle) {
    this.PaddleMesh = paddle;
  }
  Step(dt: number) {
    //TEST:
    this.paddle.update();
    this.applyMagnusEffect();
    this.world.step(this.eventQueue);

    this.eventQueue.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;
      this.handleCollision(h1, h2);
    });
  }

  private handleCollision(handle1: number, handle2: number) {
    const now = performance.now();
    const ballHandle = this.ball.collider.handle;
    const paddleHandle = this.paddle.collider.handle;
    const floorHandle = this.floor.collider.handle;
    const netHandle = this.net.collider.handle;
    const tableHandle = this.table.collider.handle;

    // Ball + Paddle
    if (
      (handle1 === ballHandle && handle2 === paddleHandle) ||
      (handle2 === ballHandle && handle1 === paddleHandle)
    ) {
      if (this.lastHitPlayer === this.PlayerId) {
        // Prevent double hit from same player
        console.log("Double hit prevented");
        return;
      }
      this.onBallPaddleCollision?.(this.ball.body, this.paddle.body);
      return;
    }

    // Ball + Floor
    if (
      (handle1 === ballHandle && handle2 === floorHandle) ||
      (handle2 === ballHandle && handle1 === floorHandle)
    ) {
      this.onBallFloorCollision?.(this.ball.body, this.floor.body);
      return;
    }

    // Ball + Net
    if (
      (handle1 === ballHandle && handle2 === netHandle) ||
      (handle2 === ballHandle && handle1 === netHandle)
    ) {
      this.onBallNetCollision?.(this.ball.body, this.net.body);
      return;
    }
    // Ball + Table
    if (
      (handle1 === ballHandle && handle2 === tableHandle) ||
      (handle2 === ballHandle && handle1 === tableHandle)
    ) {
      this.onBallTableCollision?.(this.ball.body, this.table.body);
      return;
    }
  }

  updatePaddleRotationZ(angleDeg: number) {
    // Convert degrees → radians
    const angleRad = (angleDeg * Math.PI) / 180;

    // Rotation only around Z
    const quat = {
      x: 0,
      y: 0,
      z: Math.sin(angleRad / 2),
      w: Math.cos(angleRad / 2),
    };

    this.paddle.body.setNextKinematicRotation(quat);
  }

  private applyMagnusEffect(): void {
    if (!this.getApplySpin()) return;

    const ballVel = this.ball.body.linvel();

    let magnusForceX = this.ballSpin.y;
    // console.log("Spin Y (around Y axis):", this.ballSpin.y);
    this.ball.body.setLinvel(
      {
        x: ballVel.x + magnusForceX * this.timestep,
        y: ballVel.y, // No Y change
        z: ballVel.z, // No Z change
      },
      true,
    );

    // Decay spin
    this.ballSpin.scaleInPlace(this.spinDecay);
  }
  //  setters
  setBallVelocity(x: number, y: number, z: number) {
    this.ball.body.setLinvel({ x, y, z }, true);
  }
  public setBallFrozen(frozen: boolean) {
    if (frozen) {
      this.ball.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      this.ball.body.setGravityScale(0, true);
    } else {
      this.ball.body.setGravityScale(1, true);
    }
  }
  setBallPosition(x: number, y: number, z: number) {
    this.ball.body.setTranslation({ x, y, z }, true);
  }
  setBallDensity(density: number) {
    const collider = this.ball.body.collider(0);
    if (collider) {
      collider.setDensity(density);
    } else {
      console.error("Collider not found for the ball body.");
    }
  }
  public setPaddlePosition(x: number, y: number, z: number) {
    if (!this.paddle.body) return;
    this.paddle.body.setNextKinematicTranslation({ x, y, z });
  }
  public setPaddleZRotation(rotationZ: number) {
    if (!this.paddle.body) return;

    // Convert Z rotation to quaternion manually
    const halfZ = rotationZ / 2;
    const quat = { x: 0, y: 0, z: Math.sin(halfZ), w: Math.cos(halfZ) };
    this.paddle.body.setNextKinematicRotation(quat);
  }

  public setBallSpin(x: number, y: number, z: number): void {
    this.ballSpin.set(x, y, z);
  }
  public setApplySpin(apply: boolean) {
    this.appySpin = apply;
  }

  public setLastHitBy(playerId: string | null) {
    this.lastHitPlayer = playerId;
  }
  public setPlayerId(playerId: string | null) {
    this.PlayerId = playerId;
  }
  // getters
  public getBallStatus(): Boolean {
    // return true if ball frozen
    const gravityScale = this.ball.body.gravityScale();
    const linvel = this.ball.body.linvel();
    const isFrozen =
      gravityScale === 0 && linvel.x === 0 && linvel.y === 0 && linvel.z === 0;
    return isFrozen;
  }
  public getBallVelocity(): Vector3 {
    return new Vector3(
      this.ball.body.linvel().x,
      this.ball.body.linvel().y,
      this.ball.body.linvel().z,
    );
  }
  public getBallPosition(): Vector3 {
    return new Vector3(
      this.ball.body.translation().x,
      this.ball.body.translation().y,
      this.ball.body.translation().z,
    );
  }

  public getballbody(): RAPIER.RigidBody {
    return this.ball.body;
  }

  public getPaddlePosition(): Vector3 {
    if (!this.paddle.body) return new Vector3(0, 0, 0);
    const pos = this.paddle.body.translation();
    return new Vector3(pos.x, pos.y, pos.z);
  }

  public getPaddleRotation(): Vector3 {
    if (!this.paddle.body) return new Vector3(0, 0, 0);
    const quat = this.paddle.body.rotation();
    return new Vector3(quat.x, quat.y, quat.z);
  }
  public getPaddleZRotation(): number {
    if (!this.paddle.body) return 0;

    const quat = this.paddle.body.rotation();
    const siny_cosp = 2 * (quat.w * quat.z + quat.x * quat.y);
    const cosy_cosp = 1 - 2 * (quat.y * quat.y + quat.z * quat.z);
    return Math.atan2(siny_cosp, cosy_cosp);
  }
  public getPaddleVelocity(): Vector3 {
    if (!this.paddle.body) return new Vector3(0, 0, 0);
    const vel = this.paddle.body.linvel();
    return new Vector3(vel.x, vel.y, vel.z);
  }
  public getBallSpin(): Vector3 {
    return this.ballSpin.clone();
  }
  public getApplySpin(): boolean {
    return this.appySpin;
  }
}
