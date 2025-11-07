import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export class Paddle {
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;

  // TEST:
  private target = new RAPIER.Vector3(0, 0, 0);
  private prevPos = new RAPIER.Vector3(0, 0, 0);
  private currPos = new RAPIER.Vector3(0, 0, 0);

  constructor(world: RAPIER.World) {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(
        constants.PADDLE.position.right.x,
        constants.PADDLE.position.right.y,
        constants.PADDLE.position.right.z,
      )
      .setCcdEnabled(true)
      .lockRotations()
      .setLinearDamping(4);

    this.body = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      constants.PADDLE.size.width / 2,
      constants.PADDLE.size.height / 2,
      constants.PADDLE.size.length / 2,
    )
      .setDensity(4)
      .setSensor(true); // Set as sensor to avoid physical collisions

    this.collider = world.createCollider(colliderDesc, this.body);
    this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  }

  public setPaddleTargetPosition(x: number, y: number, z: number) {
    if (!this.body) return;

    const curr = this.body.translation();
    const targetX = x;
    const targetY = y;
    const targetZ = z;

    // Use similar smoothing as mesh (0.4 * 60fps ≈ 24 for invDt)
    const SMOOTH = 0.3; // Match your mesh interpolation
    const sx = curr.x + (targetX - curr.x) * SMOOTH;
    const sy = curr.y + (targetY - curr.y) * SMOOTH;
    const sz = curr.z + (targetZ - curr.z) * SMOOTH;

    const invDt = 100; // Lower value for smoother movement to match mesh
    let vx = (sx - curr.x) * invDt;
    let vy = (sy - curr.y) * invDt;
    let vz = (sz - curr.z) * invDt;

    this.body.setLinvel({ x: vx, y: vy, z: vz }, true);
  }

  getVelocity(): RAPIER.Vector3 {
    return this.body.linvel();
  }
  getBody(): RAPIER.RigidBody {
    return this.body;
  }

  // TEST:
  getInterpolatedPos(alpha: number): RAPIER.Vector3 {
    return {
      x: this.prevPos.x + (this.currPos.x - this.prevPos.x) * alpha,
      y: this.prevPos.y + (this.currPos.y - this.prevPos.y) * alpha,
      z: this.prevPos.z + (this.currPos.z - this.prevPos.z) * alpha,
    };
  }

  // --- Called from controller each frame when mouse moves ---
  setTarget(x: number, y: number, z: number) {
    this.target.x = x;
    this.target.y = y;
    this.target.z = z;
  }
  // --- Called from physics loop (fixedUpdate at 60Hz) ---
  update() {
    this.prevPos = this.currPos;
    this.currPos = this.body.translation();

    const curr = this.currPos;
    const diff = {
      x: this.target.x - curr.x,
      y: this.target.y - curr.y,
      z: this.target.z - curr.z,
    };
    const SMOOTH = 40; // adjust for responsiveness
    this.body.setLinvel(
      { x: diff.x * SMOOTH, y: diff.y * SMOOTH, z: diff.z * SMOOTH },
      true,
    );
  }
}
