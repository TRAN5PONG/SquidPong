import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";

export function useTablePhysics(world: RAPIER.World | null) {
  const bodyRef = useRef<RAPIER.RigidBody | null>(null);
  const colliderRef = useRef<RAPIER.Collider | null>(null);

  useEffect(() => {
    if (!world) return;

    // --- Body setup (fixed/static) ---
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      constants.TABLE.position.x,
      constants.TABLE.position.y,
      constants.TABLE.position.z
    );

    const body = world.createRigidBody(bodyDesc);
    bodyRef.current = body;

    // --- Collider setup (cuboid) ---
    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      constants.TABLE.size.width / 2,
      constants.TABLE.size.height / 2,
      constants.TABLE.size.length / 2
    )
      .setRestitution(0.8)
      .setFriction(0);

    const collider = world.createCollider(colliderDesc, body);
    colliderRef.current = collider;

    // --- Cleanup ---
    return () => {
      if (collider) world.removeCollider(collider, true);
      if (body) world.removeRigidBody(body);
    };
  }, [world]);

  return { body: bodyRef, collider: colliderRef };
}
