import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export class Floor {
    public body: RAPIER.RigidBody;
    public collider: RAPIER.Collider;

    constructor(world: RAPIER.World) {
        this.body = world.createRigidBody(
            RAPIER.RigidBodyDesc.fixed().setTranslation(
                constants.FLOOR.position.x,
                constants.FLOOR.position.y,
                constants.FLOOR.position.z
            )
        );

        const colliderDesc = RAPIER.ColliderDesc.cuboid(
            constants.FLOOR.size.width / 2,
            constants.FLOOR.size.height / 2,
            constants.FLOOR.size.length / 2
        )
            .setRestitution(0.6)
            .setFriction(0.8);

        this.collider = world.createCollider(colliderDesc, this.body);
        this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    }
}