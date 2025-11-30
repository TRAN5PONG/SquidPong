import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ballResetMessage } from "@/types/network";

export class Ball {
  private prev_pos: Vector3;
  private current_pos: Vector3;
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;

  constructor(
    world: RAPIER.World,
    mode: "BounceGame" | "PongGame" = "PongGame",
  ) {
    const ballConstants =
      mode === "PongGame" ? constants.BALL : constants.BOUNCE_GAME_BALL;

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(
        ballConstants.position.x,
        ballConstants.position.y,
        ballConstants.position.z,
      )
      .setLinearDamping(0.1)
      .setAngularDamping(0.1)
      .setCcdEnabled(true)
      .setAngvel({ x: 0, y: 0, z: 0 }, true);

    this.body = world.createRigidBody(bodyDesc);

    this.freeze();
    
    // Use mode-specific physics values
    const restitution = mode === "BounceGame" ? (ballConstants as any).restitution || 0.7 : 0.8;
    const friction = mode === "BounceGame" ? (ballConstants as any).friction || 0.8 : 0;
    const density = mode === "BounceGame" ? (ballConstants as any).density || 0.5 : 0.8;
    
    const colliderDesc = RAPIER.ColliderDesc.ball(ballConstants.radius)
      .setRestitution(restitution)
      .setFriction(friction)
      .setDensity(density)
      .setSensor(false);
    this.collider = world.createCollider(colliderDesc, this.body);
    this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

    const initialPos = new Vector3(
      this.body.translation().x,
      this.body.translation().y,
      this.body.translation().z,
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
        this.body.translation().z,
      );
    else
      this.current_pos = new Vector3(
        this.body.translation().x,
        this.body.translation().y,
        this.body.translation().z,
      );
  }

  public reset(data: ballResetMessage): void {
    this.body.setTranslation(
      { x: data.position.x, y: data.position.y, z: data.position.z },
      true,
    );
    this.body.setLinvel(
      { x: data.velocity.x, y: data.velocity.y, z: data.velocity.z },
      true,
    );
  }

  public setCollisionEnabled(enabled: boolean) {
    if (enabled) {
      this.collider.setEnabled(true);
    } else {
      this.collider.setEnabled(false);
    }
  }
  public freeze(): void {
    // stop movement
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // disable gravity
    this.body.setGravityScale(0, true);

    // lock movement & rotation
    this.body.lockTranslations(true, true);
    this.body.lockRotations(true, true);
  }

  public unfreeze(): void {
    // unlock movement
    this.body.lockTranslations(false, true);
    this.body.lockRotations(false, true);

    // restore gravity
    this.body.setGravityScale(1, true);

    // ensure no weird leftover velocity
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }
}
