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
}