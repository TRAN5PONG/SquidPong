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
        constants.PADDLE.position.x,
        constants.PADDLE.position.y,
        constants.PADDLE.position.z,
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
      .setFriction(0)
      .setSensor(true); // Set as sensor to avoid physical collisions

    this.collider = world.createCollider(colliderDesc, this.body);
    this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  }

  getVelocity(): RAPIER.Vector3 {
    return this.body.linvel();
  }
  getBody(): RAPIER.RigidBody {
    return this.body;
  }

  getInterpolatedPos(alpha: number): RAPIER.Vector3 {
    return {
      x: this.prevPos.x + (this.currPos.x - this.prevPos.x) * alpha,
      y: this.prevPos.y + (this.currPos.y - this.prevPos.y) * alpha,
      z: this.prevPos.z + (this.currPos.z - this.prevPos.z) * alpha,
    };
  }

  setTarget(x: number, y: number, z: number) {
    this.target.x = x;
    this.target.y = y;
    this.target.z = z;
  }

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
