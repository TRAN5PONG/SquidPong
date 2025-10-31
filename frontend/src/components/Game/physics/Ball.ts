import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class Ball {
  private prev_pos: Vector3;
  private current_pos: Vector3;
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;

  constructor(world: RAPIER.World) {
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(
        constants.BALL.position.x,
        constants.BALL.position.y,
        constants.BALL.position.z
      )
      .setLinearDamping(0.2)
      .setAngularDamping(0.1)
      .setCcdEnabled(true);

    this.body = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(constants.BALL.radius)
      .setRestitution(0.8)
      .setFriction(0)
      .setDensity(0.8)
      .setSensor(false);

    this.collider = world.createCollider(colliderDesc, this.body);
    this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

    const initialPos = new Vector3(
      this.body.translation().x,
      this.body.translation().y,
      this.body.translation().z
    );
    this.prev_pos = initialPos.clone();
    this.current_pos = initialPos.clone();
  }

  getPrevPosition(): Vector3 {
    return this.prev_pos;
  }
  getCurrentPosition(): Vector3 {
    return this.current_pos;
  }
  setPosition(type: "PREV" | "CURR"): void {
    if (type === "PREV")
      this.prev_pos = new Vector3(
        this.body.translation().x,
        this.body.translation().y,
        this.body.translation().z
      );
    else
      this.current_pos = new Vector3(
        this.body.translation().x,
        this.body.translation().y,
        this.body.translation().z
      );
  }
}
