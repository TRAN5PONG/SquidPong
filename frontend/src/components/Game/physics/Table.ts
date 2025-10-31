import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export class Table {
    constructor(world: RAPIER.World) {
        const body = world.createRigidBody(
            RAPIER.RigidBodyDesc.fixed().setTranslation(
                constants.TABLE.position.x,
                constants.TABLE.position.y,
                constants.TABLE.position.z
            )
        );

        const collider = RAPIER.ColliderDesc.cuboid(
            constants.TABLE.size.width / 2,
            constants.TABLE.size.height / 2,
            constants.TABLE.size.length / 2
        )
            .setRestitution(0.8)
            .setFriction(0);

        world.createCollider(collider, body);
    }
}