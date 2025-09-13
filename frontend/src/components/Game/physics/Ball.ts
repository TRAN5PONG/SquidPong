import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export class Ball {
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
    }
}
