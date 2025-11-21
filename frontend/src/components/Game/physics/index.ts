import RAPIER from "@dimforge/rapier3d-compat";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { constants } from "@/utils/constants";
import { ballResetMessage } from "@/types/network";

import { Ball } from "./Ball";
import { Paddle } from "./Paddle";
import { Floor } from "./Floor";
import { Net } from "./Net";
import { Table } from "./Table";

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

  // Visual speed boost system
  private visualSpeedBoost: number = 1.8;
  private applySpeedBoost: boolean = false;
  private readonly SPEED_BOOST_DECAY: number = 0.98; // How fast boost decays

  timestep = 1 / 60;

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
    contactPoint: Vector3,
    contactNormal: Vector3,
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
    this.applyVisualSpeedBoost();

    this.world.step(this.eventQueue);

    this.eventQueue.drainCollisionEvents((h1: any, h2: any, started: any) => {
      if (!started) return;
      this.handleCollision(h1, h2);
    });
  }

  private handleCollision(handle1: number, handle2: number) {
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
      const ballPos = this.ball.body.translation();
      const contactPoint = new Vector3(ballPos.x, ballPos.y - 0.05, ballPos.z);
      const contactNormal = new Vector3(0, 1, 0); // Upward normal

      // Call callback
      this.onBallTableCollision?.(
        this.ball.body,
        this.table.body,
        contactPoint,
        contactNormal,
      );

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
    if (this.ballSpin.y == 0) return;
    const spinY = this.ballSpin.y;
    if (spinY > -0.1 && spinY < 0.1) {
      this.ballSpin.scaleInPlace(this.spinDecay);
      return;
    }
    const ballVel = this.ball.body.linvel();
    const spinTimestep = spinY * this.timestep;
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

    const ballVel = this.ball.body.linvel();

    const boostAmount = this.visualSpeedBoost - 1.0; // 0.5 for 1.5x boost
    const boostTimestep = boostAmount * this.timestep;

    const velMagnitude = Math.sqrt(
      ballVel.x * ballVel.x + ballVel.y * ballVel.y + ballVel.z * ballVel.z,
    );

    if (velMagnitude > 0.01) {
      // Normalize and apply boost  (Find Direction)
      const normX = ballVel.x / velMagnitude;
      const normY = ballVel.y / velMagnitude;
      const normZ = ballVel.z / velMagnitude;

      this.ball.body.setLinvel(
        {
          x: ballVel.x + normX * boostTimestep * 10,
          y: ballVel.y + normY * boostTimestep * 10,
          z: ballVel.z + normZ * boostTimestep * 10,
        },
        true,
      );
    }

    // Decay the boost multiplier over time
    this.visualSpeedBoost *= this.SPEED_BOOST_DECAY;
  }

  // ================= Speed Boost Setters/Getters =================
  public setApplySpeedBoost(apply: boolean): void {
    this.applySpeedBoost = apply;
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
    return this.applySpeedBoost;
  }

  // ==== Reset ====
  public reset(frozen: boolean, data?: ballResetMessage): void {
    if (!data) {
      // Default reset
      data = {
        position: { x: 0, y: 4, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
      };
    }
    this.ball.reset(data);
    console.log("jj-2");
    this.setBallFrozen(frozen);
  }
  //  setters
  setBallVelocity(x: number, y: number, z: number) {
    this.ball.body.setLinvel({ x, y, z }, true);
  }
  public setBallFrozen(frozen: boolean) {
    console.log("Setting ball frozen: ", frozen);
    if (frozen) {
      this.ball.freeze();
    } else {
      this.ball.unfreeze();
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

  public setBallSpin(x: number, y: number, z: number): void {
    this.ballSpin.set(x, y, z);
  }
  public setApplySpin(apply: boolean) {
    this.appySpin = apply;
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
