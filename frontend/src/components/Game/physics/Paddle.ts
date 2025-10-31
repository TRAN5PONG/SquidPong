import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export class Paddle {
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;

  constructor(world: RAPIER.World) {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 0, 0)
      .setCcdEnabled(true)
      .lockRotations()
      .setLinearDamping(0);

    this.body = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      constants.PADDLE.size.width / 2,
      constants.PADDLE.size.height / 2,
      constants.PADDLE.size.length / 2
    )
      .setDensity(4)
      .setSensor(true);

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
}
