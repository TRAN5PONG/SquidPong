import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export class Paddle {
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;

  private target = new RAPIER.Vector3(0, 0, 0);
  private prevPos = new RAPIER.Vector3(0, 0, 0);
  private currPos = new RAPIER.Vector3(0, 0, 0);

  constructor(
    world: RAPIER.World,
    mode: "BounceGame" | "PongGame" = "PongGame",
  ) {
    const paddleConstants =
      mode === "PongGame" ? constants.PADDLE : constants.BOUNCE_GAME_PADDLE;

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(
        paddleConstants.position.x,
        paddleConstants.position.y,
        paddleConstants.position.z,
      )
      .setCcdEnabled(true)
      .setLinearDamping(mode === "BounceGame" ? 2 : 4);
    
      bodyDesc.lockRotations();

    this.body = world.createRigidBody(bodyDesc);

    const restitution = mode === "BounceGame" ? (paddleConstants as any).restitution || 0.4 : 0;
    const friction = mode === "BounceGame" ? (paddleConstants as any).friction || 0.8 : 0;
    const isSensor = mode === "PongGame";

    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      paddleConstants.size.width / 2,
      paddleConstants.size.height / 2,
      paddleConstants.size.length / 2,
    )
      .setDensity(4)
      .setRestitution(restitution)
      .setFriction(friction)
      .setSensor(isSensor);

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

  setRotationZ(angleRad: number) {
    // Create quaternion from Z-axis rotation
    const quat = new RAPIER.Quaternion(0, 0, 0, 1);
    quat.x = 0;
    quat.y = 0;
    quat.z = Math.sin(angleRad / 2);
    quat.w = Math.cos(angleRad / 2);
    
    this.body.setRotation(quat, true);
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
    const SMOOTH = 40; 
    this.body.setLinvel(
      { x: diff.x * SMOOTH, y: diff.y * SMOOTH, z: diff.z * SMOOTH },
      true,
    );
  }
}
