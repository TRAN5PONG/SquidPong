import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export function useNetPhysics(world: RAPIER.World | null) {
  const bodyRef = useRef<RAPIER.RigidBody | null>(null);
  const colliderRef = useRef<RAPIER.Collider | null>(null);

  useEffect(() => {
    if (!world) return;

    // --- Body setup (fixed/static) ---
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      constants.NET.position.x,
      constants.NET.position.y,
      constants.NET.position.z
    );

    const body = world.createRigidBody(bodyDesc);
    bodyRef.current = body;

    // --- Collider setup (cuboid for the net) ---
    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      constants.NET.size.width / 2,
      constants.NET.size.height / 2,
      constants.NET.size.length / 2
    )
      .setRestitution(0.4)
      .setFriction(0.8);

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
