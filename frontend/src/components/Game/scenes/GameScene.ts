import { RefObject, useEffect, useRef, useState } from "@/lib/Zeroact";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core";

// Entities
import { useCamera } from "../entities/cameras/camera";
import { useLight } from "../entities/light";
// import { useBall } from "../entities/Ball";
// import { usePaddle } from "../entities/paddle";
import { useArena } from "../entities/Arena";
import { usePhysics } from "../physics";
import { usePaddle } from "../entities/paddle";
import { useCinematicCamera } from "../entities/cameras/cinematicCamera";

export function useGameScene(canvasRef: RefObject<HTMLCanvasElement>) {
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  // paddles
  const L_paddle = usePaddle(sceneRef.current!);
  const R_paddle = usePaddle(sceneRef.current!, -1);

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
  // Physics
  // usePhysics();

  // Cameras
  const camera = useCamera(sceneRef.current!, -1, canvasRef.current!);
  const cinematicCamera = useCinematicCamera(
    sceneRef.current!,
    canvasRef.current!
  );

  // const ball = useBall(sceneRef.current!);
  // const paddle = usePaddle(
  //   sceneRef.current!,
  //   canvasRef.current!,
  //   camera.camera!
  // );
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

  // Return refs, entities, or any update methods needed
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
