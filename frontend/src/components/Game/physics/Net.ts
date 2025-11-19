import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export class Net {
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;

  constructor(world: RAPIER.World) {
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(
        constants.NET.position.x,
        constants.NET.position.y,
        constants.NET.position.z,
      ),
    );

    const collider = RAPIER.ColliderDesc.cuboid(
      constants.NET.size.width / 2,
      constants.NET.size.height / 2,
      constants.NET.size.length / 2,
    )
      .setRestitution(0.4)
      .setFriction(0);

    this.collider = world.createCollider(collider, this.body);
    this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
  }
}

