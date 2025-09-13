import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export function usePaddlePhysics(world: RAPIER.World | null) {
  const bodyRef = useRef<RAPIER.RigidBody | null>(null);
  const colliderRef = useRef<RAPIER.Collider | null>(null);

  useEffect(() => {
    if (!world) return;

    // --- Body setup (dynamic, no rotation, linear damping 0) ---
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 0, 0)
      .setCcdEnabled(true)
      .lockRotations()
      .setLinearDamping(0);

    const body = world.createRigidBody(bodyDesc);
    bodyRef.current = body;

    // --- Collider setup (cuboid sensor) ---
    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      constants.PADDLE.size.width / 2,
      constants.PADDLE.size.height / 2,
      constants.PADDLE.size.length / 2
    )
      .setDensity(4)
      .setSensor(true);

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
