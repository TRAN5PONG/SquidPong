import { useEffect, useRef } from "@/lib/Zeroact";
import RAPIER from "@dimforge/rapier3d-compat";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { constants } from "@/utils/constants";

import { useBallPhysics } from "./Ball";
import { usePaddlePhysics } from "./Paddle";
import { useFloorPhysics } from "./Floor";
import { useNetPhysics } from "./Net";
import { useTablePhysics } from "./Table";

export function usePhysicsWorld() {
  const worldRef = useRef<RAPIER.World | null>(null);
  const eventQueueRef = useRef<RAPIER.EventQueue | null>(null);

  const lastCollisionTime = useRef<number>(performance.now());
  const ballSpin = useRef<Vector3>(new Vector3(0, 0, 0));
  const applySpin = useRef(false);
  const impulseRef = useRef<Vector3 | null>(null);
  const timestep = 1 / 60;

  // Callbacks
  const onBallPaddleCollision = useRef<
    ((ball: RAPIER.RigidBody, paddle: RAPIER.RigidBody) => void) | undefined
  >(undefined);
  const onBallFloorCollision = useRef<
    ((ball: RAPIER.RigidBody, floor: RAPIER.RigidBody) => void) | undefined
  >(undefined);
  const onBallNetCollision = useRef<
    ((ball: RAPIER.RigidBody, net: RAPIER.RigidBody) => void) | undefined
  >(undefined);

  // Entity refs
  const ballBody = useRef<RAPIER.RigidBody | null>(null);
  const ballCollider = useRef<RAPIER.Collider | null>(null);
  const paddleBody = useRef<RAPIER.RigidBody | null>(null);
  const paddleCollider = useRef<RAPIER.Collider | null>(null);
  const floorBody = useRef<RAPIER.RigidBody | null>(null);
  const floorCollider = useRef<RAPIER.Collider | null>(null);
  const netBody = useRef<RAPIER.RigidBody | null>(null);
  const netCollider = useRef<RAPIER.Collider | null>(null);
  const tableBody = useRef<RAPIER.RigidBody | null>(null);
  const tableCollider = useRef<RAPIER.Collider | null>(null);

  // Target positions (refs for performance)
  const TargetX = useRef(0);
  const TargetZ = useRef(0);

  useEffect(() => {
    (async () => {
      await RAPIER.init();

      // --- World setup ---
      const world = new RAPIER.World(constants.Gravity);
      world.timestep = timestep;
      worldRef.current = world;

      const eventQueue = new RAPIER.EventQueue(false);
      eventQueueRef.current = eventQueue;

      // --- Entities setup ---
      const ball = useBallPhysics(world);
      ballBody.current = ball.body.current;
      ballCollider.current = ball.collider.current;

      const paddle = usePaddlePhysics(world);
      paddleBody.current = paddle.body.current;
      paddleCollider.current = paddle.collider.current;

      const floor = useFloorPhysics(world);
      floorBody.current = floor.body.current;
      floorCollider.current = floor.collider.current;

      const net = useNetPhysics(world);
      netBody.current = net.body.current;
      netCollider.current = net.collider.current;

      const table = useTablePhysics(world);
      tableBody.current = table.body.current;
      tableCollider.current = table.collider.current;
    })();

    return () => {
      if (!worldRef.current) return;
      [
        ballCollider.current,
        paddleCollider.current,
        floorCollider.current,
        netCollider.current,
        tableCollider.current,
      ].forEach((c) => c && worldRef.current?.removeCollider(c, true));

      [
        ballBody.current,
        paddleBody.current,
        floorBody.current,
        netBody.current,
        tableBody.current,
      ].forEach((b) => b && worldRef.current?.removeRigidBody(b));
    };
  }, []);

  // --- Helpers ---
  const updatePaddle = (currPos: Vector3) => {
    if (!paddleBody.current) return;
    paddleBody.current.setNextKinematicTranslation({
      x: currPos.x,
      y: currPos.y,
      z: currPos.z,
    });
  };

  const queueBallImpulse = (impulse: Vector3) => {
    impulseRef.current = impulse;
  };

  const step = () => {
    const world = worldRef.current;
    const queue = eventQueueRef.current;
    if (!world || !queue) return;

    applyMagnusEffect();

    world.step(queue);

    queue.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;
      handleCollision(h1, h2);
    });
  };

  const handleCollision = (handle1: number, handle2: number) => {
    const now = performance.now();
    if (!ballCollider.current || !paddleCollider.current) return;

    const bHandle = ballCollider.current.handle;
    const pHandle = paddleCollider.current.handle;
    const fHandle = floorCollider.current?.handle ?? -1;
    const nHandle = netCollider.current?.handle ?? -1;

    // Ball + Paddle
    if (
      (handle1 === bHandle && handle2 === pHandle) ||
      (handle2 === bHandle && handle1 === pHandle)
    ) {
      if (now - lastCollisionTime.current! < 150) return;
      lastCollisionTime.current = now;
      onBallPaddleCollision.current?.(ballBody.current!, paddleBody.current!);
      return;
    }

    // Ball + Floor
    if (
      (handle1 === bHandle && handle2 === fHandle) ||
      (handle2 === bHandle && handle1 === fHandle)
    ) {
      onBallFloorCollision.current?.(ballBody.current!, floorBody.current!);
      return;
    }

    // Ball + Net
    if (
      (handle1 === bHandle && handle2 === nHandle) ||
      (handle2 === bHandle && handle1 === nHandle)
    ) {
      onBallNetCollision.current?.(ballBody.current!, netBody.current!);
      return;
    }
  };

  const applyMagnusEffect = () => {
    if (!applySpin.current || !ballBody.current) return;

    const ballVel = ballBody.current.linvel();
    ballBody.current.setLinvel(
      {
        x: ballVel.x + ballSpin.current!.x,
        y: ballVel.y,
        z: ballVel.z,
      },
      true
    );

    ballSpin.current!.scaleInPlace(0.98);
  };

  return {
    world: worldRef,
    ballBody,
    paddleBody,
    floorBody,
    netBody,
    tableBody,
    step,
    updatePaddle,
    queueBallImpulse,
    TargetX,
    TargetZ,
    ballSpin,
    applySpin,
    onBallPaddleCollision,
    onBallFloorCollision,
    onBallNetCollision,
  };
}
