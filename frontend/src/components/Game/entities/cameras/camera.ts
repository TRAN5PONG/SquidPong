import { useEffect, useRef, useState } from "@/lib/Zeroact";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";
import gsap from "gsap";
import { TransformNode } from "@babylonjs/core";
import "@babylonjs/inspector";

export type CameraModeName =
  | "pov Left" // Player's left-side view (first-person/close third-person)
  | "pov Right" // Player's right-side view
  | "overview Center" // Center-wide third-person view
  | "overview Top" // Top-down tactical view
  | "corner Left" // Diagonal corner view from the left
  | "corner Right"; // Diagonal corner view from the right

interface CameraMode {
  mode_name: CameraModeName;
  alpha: number;
  beta: number;
  radius: number;
  target?: Vector3;
}
export const cameraModes: CameraMode[] = [
  {
    mode_name: "pov Left",
    alpha: Math.PI / 2,
    beta: Math.PI / 3 + 0.16,
    radius: 6.4,
  },
  {
    mode_name: "pov Right",
    alpha: -Math.PI / 2,
    beta: Math.PI / 3 + 0.2,
    radius: 8,
  },
  {
    mode_name: "overview Center",
    alpha: 0,
    beta: Math.PI / 3 + 0.2,
    radius: 9,
  },
  {
    mode_name: "overview Top",
    alpha: 0,
    beta: -Math.PI,
    radius: 10,
  },
  {
    mode_name: "corner Left",
    alpha: -Math.PI / 5.2,
    beta: Math.PI / 4 + 0.6,
    radius: 15,
  },
  {
    mode_name: "corner Right",
    alpha: Math.PI / 1.4,
    beta: Math.PI / 4 + 0.6,
    radius: 15,
  },
];



export function useCamera(
  scene: Scene,
  side: number,
  canvas?: HTMLCanvasElement
) {
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const pivotRef = useRef<TransformNode | null>(null);
  const [currentMode, setCurrentMode] = useState<CameraModeName>("pov Left");

  useEffect(() => {
    if (!scene || !cameraRef.current) return;

    const mode = cameraModes.find((m) => m.mode_name === currentMode);
    if (!mode) return;

    // If pivot exists, attach camera to it for smooth rotation
    if (pivotRef.current) {
      cameraRef.current.parent = pivotRef.current;
      pivotRef.current.rotation = new Vector3(0, 0, 0); // Reset pivot rotation
    } else {
      cameraRef.current.parent = null; // Ensure no parent
    }

    // Animate camera to new mode
    gsap.to(cameraRef.current, {
      alpha: mode.alpha,
      beta: mode.beta,
      radius: mode.radius,
      duration: 1.5,
      ease: "power2.out",
    });
  }, [currentMode]);

  useEffect(() => {
    if (!scene || !canvas) return;

    // Initial setup
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 3 + 0.16,
      6.4,
      new Vector3(0, 1.5, 0),
      scene
    );

    camera.attachControl(canvas, true);
    scene.activeCamera = camera;
    cameraRef.current = camera;

    return () => {
      if (pivotRef.current) {
        pivotRef.current.dispose();
        pivotRef.current = null;
      }
      camera.dispose();
      cameraRef.current = null;
    };
  }, [scene, side, canvas]);

  return {
    camera: cameraRef.current,
    currentMode,
    setCurrentMode,
  };
}
