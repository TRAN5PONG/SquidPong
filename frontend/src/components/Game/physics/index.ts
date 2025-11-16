import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { constants } from "@/utils/constants";
import { ballResetMessage } from "@/types/network";

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

  // Visual speed boost system (NEW!)
  private visualSpeedBoost: number = 1.0; // Multiplier for visual speed
  private applySpeedBoost: boolean = false;
  private readonly SPEED_BOOST_DECAY: number = 0.995; // How fast boost decays
  private readonly MIN_SPEED_BOOST: number = 1.0; // Don't go below 1.0x
  private readonly MAX_SPEED_BOOST: number = 2.0; // Max 2x speed boost

  // TEST:
  private PaddleMesh: paddle | null = null;
  timestep = 1 / 60;

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

  Step() {
    this.paddle.update();
    this.applyMagnusEffect();
    // this.applyVisualSpeedBoost();

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

  // ================= Magnus Effect =================
  private applyMagnusEffect(): void {
    if (!this.appySpin) return;
    const spinY = this.ballSpin.y;
    if (spinY > -0.1 && spinY < 0.1) {
      this.ballSpin.scaleInPlace(this.spinDecay);
      return;
    }
    const ballVel = this.ball.body.linvel();
    const spinTimestep = spinY * this.timestep;
    // console.log("Spin Y (around Y axis):", this.ballSpin.y);
    this.ball.body.setLinvel(
      {
        x: ballVel.x + spinTimestep,
        y: ballVel.y, // No Y change
        z: ballVel.z + spinTimestep * 0.4,
      },
      true,
    );

    // Decay spin
    this.ballSpin.scaleInPlace(this.spinDecay);
  }

  // ================= Visual Speed Boost (NEW!) =================

  private applyVisualSpeedBoost(): void {
    if (!this.applySpeedBoost) return;

    // If boost is at minimum, stop applying
    if (this.visualSpeedBoost <= this.MIN_SPEED_BOOST) {
      this.visualSpeedBoost = this.MIN_SPEED_BOOST;
      this.applySpeedBoost = false;
      return;
    }

    const ballVel = this.ball.body.linvel();

    // Calculate boost amount (extra velocity to add)
    const boostAmount = this.visualSpeedBoost - 1.0; // 0.5 for 1.5x boost
    const boostTimestep = boostAmount * this.timestep;

    // Apply boost in the direction of current velocity
    const velMagnitude = Math.sqrt(
      ballVel.x * ballVel.x + ballVel.y * ballVel.y + ballVel.z * ballVel.z,
    );

    if (velMagnitude > 0.01) {
      // Normalize and apply boost
      const normX = ballVel.x / velMagnitude;
      const normY = ballVel.y / velMagnitude;
      const normZ = ballVel.z / velMagnitude;

      this.ball.body.setLinvel(
        {
          x: ballVel.x + normX * boostTimestep * 10, // Multiply by 10 for visible effect
          y: ballVel.y + normY * boostTimestep * 10,
          z: ballVel.z + normZ * boostTimestep * 10,
        },
        true,
      );
    }

    // Decay the boost multiplier over time
    this.visualSpeedBoost *= this.SPEED_BOOST_DECAY;

    console.log("Speed boost active:", this.visualSpeedBoost.toFixed(3));
  }

  // ================= Speed Boost Setters/Getters =================
  /**
   * Set a visual speed boost multiplier
   * @param boost - Multiplier (1.0 = normal, 1.5 = 50% faster, 2.0 = 2x faster)
   */
  public setVisualSpeedBoost(boost: number): void {
    this.visualSpeedBoost = Math.max(
      this.MIN_SPEED_BOOST,
      Math.min(this.MAX_SPEED_BOOST, boost),
    );
    this.applySpeedBoost = this.visualSpeedBoost > this.MIN_SPEED_BOOST;

    console.log(
      "Visual speed boost set to:",
      this.visualSpeedBoost.toFixed(2) + "x",
    );
  }

  /**
   * Enable/disable visual speed boost
   */
  public setApplySpeedBoost(apply: boolean): void {
    this.applySpeedBoost = apply;
    if (!apply) {
      this.visualSpeedBoost = this.MIN_SPEED_BOOST;
    }
  }

  /**
   * Get current speed boost multiplier
   */
  public getVisualSpeedBoost(): number {
    return this.visualSpeedBoost;
  }

  /**
   * Check if speed boost is active
   */
  public isSpeedBoostActive(): boolean {
    return this.applySpeedBoost && this.visualSpeedBoost > this.MIN_SPEED_BOOST;
  }

  // ==== Reset ====
  public reset(data: ballResetMessage, frozen: boolean): void {
    console.log(
      "Resetting ball with data: ------------ ",
      data,
      "Frozen:",
      frozen,
    );
    this.ball.reset(data);
    this.setBallFrozen(frozen);
  }
  //  setters
  setBallVelocity(x: number, y: number, z: number) {
    this.ball.body.setLinvel({ x, y, z }, true);
  }
  public setBallFrozen(frozen: boolean) {
    console.log("Setting ball frozen:", frozen);
    if (frozen) {
      this.ball.body.setGravityScale(0, true);
      this.ball.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else {
      this.ball.body.setLinvel({ x: 0, y: 0, z: 0 }, false);
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
