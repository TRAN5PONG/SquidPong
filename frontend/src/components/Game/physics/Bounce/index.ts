import RAPIER from "@dimforge/rapier3d-compat";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Ball } from "../Ball";
import { Paddle } from "../Paddle";
import { Floor } from "../Floor";

export class Physics_miniGame {
  private world!: RAPIER.World;
  eventQueue: RAPIER.EventQueue = null!;
  public ball!: Ball;
  public paddle!: Paddle;
  private floor!: Floor;

  // callback
  public onBallPaddleCollision?: (
    ball: RAPIER.RigidBody,
    paddle: RAPIER.RigidBody,
  ) => void;
  public onBallFloorCollision?: (
    ball: RAPIER.RigidBody,
    floor: RAPIER.RigidBody,
  ) => void;
  timestep = 1 / 60;

  constructor() {}

  async init() {
    await RAPIER.init();

    const gravity = new RAPIER.Vector3(0, -40, 0);
    this.world = new RAPIER.World(gravity);
    this.eventQueue = new RAPIER.EventQueue(true);

    // Create entities
    this.ball = new Ball(this.world, "BounceGame");
    this.paddle = new Paddle(this.world, "BounceGame");
    this.floor = new Floor(this.world);
  }

  updatePaddle(currPos: Vector3) {
    this.paddle.setTarget(currPos.x, currPos.y, currPos.z);
  }

  Step() {
    this.paddle.update();

    this.world.step(this.eventQueue);

    this.eventQueue.drainCollisionEvents((handle1: number, handle2: number, started: boolean) => {
      if (!started) return;
      this.handleCollision(handle1, handle2);
    });
  }

  private handleCollision(handle1: number, handle2: number) {
    const ballHandle = this.ball.collider.handle;
    const paddleHandle = this.paddle.collider.handle;

    if (
      (handle1 === ballHandle && handle2 === paddleHandle) ||
      (handle2 === ballHandle && handle1 === paddleHandle)
    ) {
      if (this.onBallPaddleCollision) {
        this.onBallPaddleCollision(this.ball.body, this.paddle.body);
      }
    }

    if (
      (handle1 === ballHandle && handle2 === this.floor.collider.handle) ||
      (handle2 === ballHandle && handle1 === this.floor.collider.handle)
    ) {
      if (this.onBallFloorCollision) {
        this.onBallFloorCollision(this.ball.body, this.floor.body);
      }
    }
  }

  // Getters
  public getBallPosition(): Vector3 {
    if (!this.ball?.body) return new Vector3(0, 0, 0);
    const pos = this.ball.body.translation();
    return new Vector3(pos.x, pos.y, pos.z);
  }

  public getBallVelocity(): Vector3 {
    if (!this.ball?.body) return new Vector3(0, 0, 0);
    const vel = this.ball.body.linvel();
    return new Vector3(vel.x, vel.y, vel.z);
  }

  public getPaddlePosition(): Vector3 {
    if (!this.paddle?.body) return new Vector3(0, 0, 0);
    const pos = this.paddle.body.translation();
    return new Vector3(pos.x, pos.y, pos.z);
  }

  // Setters
  public setBallVelocity(x: number, y: number, z: number) {
    if (!this.ball?.body) return;
    this.ball.body.setLinvel({ x, y, z }, true);
  }

  public setBallPosition(x: number, y: number, z: number) {
    if (!this.ball?.body) return;
    this.ball.body.setTranslation({ x, y, z }, true);
  }

  public setBallFrozen(frozen: boolean) {
    if (!this.ball) return;
    if (frozen) {
      this.ball.freeze();
    } else {
      this.ball.unfreeze();
    }
  }
}
