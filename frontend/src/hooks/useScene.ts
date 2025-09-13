import { useCamera } from "@/components/Game/entities/cameras/camera";
import { useLight } from "@/components/Game/entities/Light";
import { RefObject, useEffect, useRef, useState } from "@/lib/Zeroact";
import { Engine, Scene } from "@babylonjs/core";

export function useScene(canvasRef: RefObject<HTMLCanvasElement>) {
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

  // Only initialize base entities when scene is ready
  const light = sceneReady ? useLight(sceneRef.current!) : null;
  const camera = sceneReady ? useCamera(sceneRef.current!, -1, canvasRef.current!) : { camera: null };

  useEffect(() => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    const cameraAttached = camera.camera && scene?.activeCamera;

    if (!engine || !scene || !cameraAttached || !sceneReady) return;

    scene.clearColor.set(0, 0, 0, 1);

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

  return {
    engine: engineRef.current,
    scene: sceneRef.current,
    camera,
    light,
    sceneReady,
  };
}