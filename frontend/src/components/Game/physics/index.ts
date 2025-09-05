import RAPIER from "@dimforge/rapier3d-compat";
import { constants } from "@/utils/constants";
import { useEffect, useRef } from "@/lib/Zeroact";

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export function usePhysics() {
  const worldRef = useRef<RAPIER.World | null>(null);
  const ballRef = useRef<RAPIER.RigidBody | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    RAPIER.init().then(() => {
      const world = new RAPIER.World(constants.Gravity);
      world.timestep = 1 / 60;

      worldRef.current = world;
      ballRef.current = createBall(world);
      createTable(world);
    });
  }, []);

  // === Initialization ===
  function createBall(world: RAPIER.World): RAPIER.RigidBody {
    const { position, radius } = constants.BALL;

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.1)
      .setAngularDamping(0);

    const body = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(radius)
      .setRestitution(0.8)
      .setFriction(0.8)
      .setDensity(0.8);

    world.createCollider(colliderDesc, body);
    return body;
  }
  function createTable(world: RAPIER.World) {
    const { position, size } = constants.TABLE;

    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
      position.x,
      position.y,
      position.z
    );

    const body = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      size.width / 2,
      size.height / 2,
      size.length / 2
    )
      .setRestitution(0.8)
      .setFriction(0.0);

    world.createCollider(colliderDesc, body);
  }

  // === Physics Update ===
  function updateLocalPhysics() {
    worldRef.current?.step();
  }

  // === Ball Control ===
  function setBallVelocity(x: number, y: number, z: number) {
    ballRef.current?.setLinvel({ x, y, z }, true);
  }
  function setBallDensity(density: number) {
    const collider = ballRef.current?.collider(0);
    if (!collider) {
      console.warn("Ball collider not found.");
      return;
    }
    collider.setDensity(density);
  }

  // === AI / Target Prediction ===
  function calculateTargetZFromVelocity(
    paddleVelocityZ: number,
    zMin: number,
    zMax: number
  ): number {
    const clamped = Math.max(-1, Math.min(1, paddleVelocityZ / 2));
    const t = (clamped + 1) / 2; // normalize to [0, 1]
    return zMin + t * (zMax - zMin);
  }

  function calculateTargetZYVelocity(
    ballPos: Vector3,
    paddlePos: Vector3,
    paddleVel: Vector3
  ): Vector3 {
    const { TABLE, Gravity } = constants;
    const safeMargin = 0.4;
    const halfLength = TABLE.size.length / 2;

    const hittingFromLeft = paddlePos.z > 0;
    const zRange = hittingFromLeft
      ? { min: -halfLength + safeMargin, max: 0.3 - safeMargin }
      : { min: 0.3 + safeMargin, max: halfLength - safeMargin };

    const targetZ = calculateTargetZFromVelocity(paddleVel.z * 0.01, zRange.min, zRange.max);
    const deltaZ = targetZ - ballPos.z;

    // Y-axis: compute arc jump over net
    const surfaceY = TABLE.position.y + TABLE.size.height / 2;
    const arcHeight = Math.max(surfaceY + 0.6, ballPos.y + 0.3);
    const heightToGain = arcHeight - ballPos.y;
    const gravity = -Gravity.y;

    const velocityY = heightToGain > 0 ? Math.sqrt(2 * gravity * heightToGain) : 0;
    const timeUp = velocityY / gravity;
    const timeDown = Math.sqrt(2 * (arcHeight - surfaceY) / gravity);
    const flightTime = timeUp + timeDown;

    // X-axis
    const halfWidth = TABLE.size.width / 2;
    const xMin = -halfWidth + safeMargin;
    const xMax = halfWidth - safeMargin;
    const targetX = Math.max(xMin, Math.min(xMax, paddlePos.x + paddleVel.x * 0.1));
    const deltaX = targetX - ballPos.x;

    return {
      x: deltaX / flightTime,
      y: velocityY,
      z: deltaZ / flightTime,
    };
  }

  return {
    worldRef,
    ballRef,
    updateLocalPhysics,
    setBallVelocity,
    setBallDensity,
    calculateTargetZFromVelocity,
    calculateTargetZYVelocity,
  };
}
