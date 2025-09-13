import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export function useBallPhysics(world: RAPIER.World | null) {
  const bodyRef = useRef<RAPIER.RigidBody | null>(null);
  const colliderRef = useRef<RAPIER.Collider | null>(null);

  useEffect(() => {
    if (!world) return;

    // --- Body setup ---
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(
        constants.BALL.position.x,
        constants.BALL.position.y,
        constants.BALL.position.z
      )
      .setLinearDamping(0.2)
      .setAngularDamping(0.1)
      .setCcdEnabled(true);

    const body = world.createRigidBody(bodyDesc);
    bodyRef.current = body;

    // --- Collider setup ---
    const colliderDesc = RAPIER.ColliderDesc.ball(constants.BALL.radius)
      .setRestitution(0.8)
      .setFriction(0)
      .setDensity(0.8)
      .setSensor(false);

    const collider = world.createCollider(colliderDesc, body);
    collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    colliderRef.current = collider;

    // --- Cleanup ---
    return () => {
      if (collider) world.removeCollider(collider, true);
      if (body) world.removeRigidBody(body);
    };
  }, [world]);

  return { body: bodyRef, collider: colliderRef };
}
