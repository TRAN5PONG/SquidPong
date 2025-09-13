import { RefObject, useEffect, useRef, useState } from "@/lib/Zeroact";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";

// Entities
import { useCamera } from "../entities/cameras/camera";
import { useLight } from "../entities/light";
import { useArena } from "../entities/Arena";
import { usePaddle } from "../entities/paddle";
import { useCinematicCamera } from "../entities/cameras/cinematicCamera";
import { Match } from "@/types/game";
import { Camera } from "@babylonjs/core";
import { usePhysicsWorld } from "../physics";

export function useGameScene(
  canvasRef: RefObject<HTMLCanvasElement>,
  match: Match | null
) {
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, {
      adaptToDeviceRatio: true,
    });
    const scene = new Scene(engine);

    engineRef.current = engine;
    sceneRef.current = scene;

    setSceneReady(true);

    return () => {
      scene.dispose();
      engine.dispose();
      engineRef.current = null;
      sceneRef.current = null;
      setSceneReady(false);
    };
  }, [canvasRef]);

  // Light
  useLight(sceneRef.current!);

  // Cameras
  const camera = useCamera(sceneRef.current!, -1, canvasRef.current!);

  // Paddles
  const U_Paddle = usePaddle(sceneRef.current!, camera.camera!, 1);

  // Physics
  const physics = usePhysicsWorld();

  const cinematicCamera = useCinematicCamera(
    sceneRef.current!,
    canvasRef.current!
  );

  // Arena
  const arena = useArena(sceneRef.current!);

  useEffect(() => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    const cameraAttached = camera.camera && scene?.activeCamera;

    // scene?.clearColor.set(0, 0, 0, 1); // Set a dark background color
    if (!engine || !scene || !cameraAttached) return;

    scene.activeCamera = camera.camera!;

    engine.runRenderLoop(() => {
      scene.render();
    });

    const onResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      engine.stopRenderLoop();
    };
  }, [sceneReady, camera.camera]);

  const resetGamePlayCamera = () => {
    if (!sceneRef.current || !camera.camera) return;
    cinematicCamera.stopCinematic();
    sceneRef.current.activeCamera = camera.camera;
  };

  return {
    engine: engineRef.current,
    scene: sceneRef.current,
    camera,
    cinematicCamera,
    resetGamePlayCamera,
    // ball,
    // paddle,
    arena,
    sceneReady,
  };
}
