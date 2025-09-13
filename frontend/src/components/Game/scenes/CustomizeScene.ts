import { RefObject, useEffect, useRef, useState } from "@/lib/Zeroact";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";

import "@babylonjs/inspector";

// Entities
import { useCamera } from "../entities/cameras/camera";
import { useLight } from "../entities/light";
import { usePaddle } from "../entities/paddle";

import {
  ArcRotateCamera,
  Color3,
  Color4,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { AnimateAutoRotate, AnimateRotation } from "@/utils/gsap";
import { GamePaddle } from "@/types/game";

function applyWireframe(meshGroup: TransformNode) {
  meshGroup.getChildMeshes().forEach((mesh) => {
    const wireframeMat = new StandardMaterial("wireframeMat", mesh.getScene());
    wireframeMat.diffuseColor = new Color3(0, 0, 0);
    wireframeMat.wireframe = true;
    mesh.material = wireframeMat;
  });
}

export function useCustomizeScene(canvasRef: RefObject<HTMLCanvasElement>) {
  const [paddleColor, setPaddleColor] = useState<Color3>(new Color3(1, 0, 0));
  const [paddleTexture, setPaddleTexture] = useState<GamePaddle | null>(null);

  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const textureLayerRef = useRef<TransformNode | null>(null);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true, {
      adaptToDeviceRatio: true,
      alpha: true,
    });
    const scene = new Scene(engine);
    const cam = new ArcRotateCamera(
      "paddlePreviewCam",
      Math.PI / 2,
      Math.PI / 2,
      2,
      Vector3.Zero(),
      scene
    );
    cam.attachControl(canvasRef.current, true);
    cam.inputs.clear(); // disable default controls
    cam.allowUpsideDown = false;
    cam.lowerBetaLimit = 0.5;
    cam.upperBetaLimit = 1.5;
    cam.lowerRadiusLimit = 1.5;
    cam.upperRadiusLimit = 2.5;

    engineRef.current = engine;
    sceneRef.current = scene;

    // scene.debugLayer.show({
    //   embedMode: true, // optional: shows it inside canvas rather than as a floating window
    // });

    setSceneReady(true);

    return () => {
      scene.dispose();
      engine.dispose();
      engineRef.current = null;
      sceneRef.current = null;
      setSceneReady(false);
    };
  }, [canvasRef]);

  useLight(sceneRef.current!);

  const paddle = usePaddle(sceneRef.current!, null, 1);

  useEffect(() => {
    const engine = engineRef.current;
    const scene = sceneRef.current;
    const mesh = paddle.meshGroup;
    const canvas = canvasRef.current;
    let targetRotationY = 0;

    if (!engine || !scene || !mesh || !canvas) return;

    const baseMat = new StandardMaterial("baseMat", scene);
    baseMat.diffuseColor = paddleColor;
    paddle.mainMesh!.material = baseMat;

    const autoRotateController = AnimateAutoRotate(mesh, 0.3);

    scene.clearColor = new Color4(0, 0, 0, 0);

    if (paddle.meshGroup) {
      paddle.meshGroup.position.set(0, 0, 0);
    }

    let isDragging = false;
    let lastX = 0;

    const onPointerDown = (event: PointerEvent) => {
      autoRotateController.pause();
      isDragging = true;
      lastX = event.clientX;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = event.clientX - lastX;
      lastX = event.clientX;
      targetRotationY -= deltaX * 0.01;
      AnimateRotation(mesh, targetRotationY);
    };

    const onPointerUp = () => {
      if (isDragging) {
        isDragging = false;
        setTimeout(() => autoRotateController.resume(), 500);
      }
    };

    engine.runRenderLoop(() => {
      scene.render();
    });

    const onResize = () => {
      engine.resize();
    };

    window.addEventListener("resize", onResize);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    return () => {
      window.removeEventListener("resize", onResize);
      engine.stopRenderLoop();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      autoRotateController.stop();
    };
  }, [sceneReady, paddle.meshGroup, canvasRef]);

  // Update base color material on paddle
  useEffect(() => {
    const mesh = paddle.mainMesh;
    const scene = sceneRef.current;

    if (!scene || !mesh) return;

    const mat = mesh.material as StandardMaterial;
    if (mat && mat instanceof StandardMaterial) {
      mat.diffuseColor = paddleColor.clone();
    }
  }, [paddleColor]);

  // Texture overlay effect
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !paddle.mainMesh) return;

    // Dispose old texture layer
    textureLayerRef.current?.dispose();
    textureLayerRef.current = null;

    if (!paddleTexture) return;

    const textureMat = new StandardMaterial("textureMat", scene);
    const texture = new Texture(paddleTexture.image, scene);

    texture.hasAlpha = true;
    texture.uScale = 1.0;
    texture.vScale = -1.0;
    texture.uOffset = 0.0;
    texture.vOffset = 0.0;

    textureMat.diffuseTexture = texture;
    textureMat.useAlphaFromDiffuseTexture = true;

    const cloned = paddle.mainMesh.clone("paddleTextureLayer", null, false);
    if (cloned) {
      cloned.position.z += 0.001;
      cloned.material = textureMat;
      textureLayerRef.current = cloned;
    }
  }, [paddleTexture]);

  return {
    engine: engineRef.current,
    scene: sceneRef.current,
    paddle,
    sceneReady,
    setPaddleColor,
    setPaddleTexture,
  };
}
