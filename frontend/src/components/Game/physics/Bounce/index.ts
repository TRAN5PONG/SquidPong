import RAPIER from "@dimforge/rapier3d-compat";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { constants } from "@/utils/constants";

import { Ball } from "../Ball";
import { Paddle } from "../Paddle";

export class Physics_miniGame {
  private world!: RAPIER.World;
  eventQueue: RAPIER.EventQueue = null!;
  public ball!: Ball;
  public paddle!: Paddle;
  private floor!: { body: RAPIER.RigidBody; collider: RAPIER.Collider };

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

    // Use stronger gravity for bounce game (like original Bounce-pong-3D)
    const gravity = new RAPIER.Vector3(0, -80, 0);
    this.world = new RAPIER.World(gravity);
    
    // Higher timestep for more accurate physics (240 Hz like original)
    this.world.integrationParameters.dt = 1.0 / 240.0;
    this.world.integrationParameters.maxCcdSubsteps = 10;
    
    this.eventQueue = new RAPIER.EventQueue(true);

    // Create entities
    this.ball = new Ball(this.world, "BounceGame");
    this.paddle = new Paddle(this.world, "BounceGame");
    this.createFloor();
  }

  private createFloor() {
    const floorDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      constants.FLOOR.position.x,
      constants.FLOOR.position.y,
      constants.FLOOR.position.z,
    );

    const floorBody = this.world.createRigidBody(floorDesc);

    const floorColliderDesc = RAPIER.ColliderDesc.cuboid(
      constants.FLOOR.size.width / 2,
      constants.FLOOR.size.height / 2,
      constants.FLOOR.size.length / 2,
    )
      .setRestitution((constants.FLOOR as any).restitution || 0.5)
      .setFriction((constants.FLOOR as any).friction || 0.7);

    const floorCollider = this.world.createCollider(
      floorColliderDesc,
      floorBody,
    );
    floorCollider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

    this.floor = { body: floorBody, collider: floorCollider };
  }

  updatePaddle(currPos: Vector3) {
    this.paddle.setTarget(currPos.x, currPos.y, currPos.z);
  }

  Step() {
    // Update paddle
    this.paddle.update();

    // Step the physics world
    this.world.step(this.eventQueue);

    // Handle collision events
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
