import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export class Table {
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;

  constructor(world: RAPIER.World) {
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(
        constants.TABLE.position.x,
        constants.TABLE.position.y,
        constants.TABLE.position.z,
      ),
    );

    const collider = RAPIER.ColliderDesc.cuboid(
      constants.TABLE.size.width / 2,
      constants.TABLE.size.height / 2,
      constants.TABLE.size.length / 2,
    )
      .setRestitution(0.6)
      .setFriction(0);

    this.collider = world.createCollider(collider, this.body);
    this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  }
}
