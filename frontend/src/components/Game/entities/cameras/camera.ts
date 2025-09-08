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
  const rotationTweenRef = useRef<gsap.core.Tween | null>(null);
  const pivotRef = useRef<TransformNode | null>(null);
  const [currentMode, setCurrentMode] = useState<CameraModeName>("pov Left");

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
      // Kill any ongoing rotation tween before disposing
      if (rotationTweenRef.current) {
        rotationTweenRef.current.kill();
        rotationTweenRef.current = null;
      }
      if (pivotRef.current) {
        pivotRef.current.dispose();
        pivotRef.current = null;
      }
      camera.dispose();
      cameraRef.current = null;
    };
  }, [scene, side, canvas]);

  function cameraRotate() {
    if (!cameraRef.current) return;

    // Create pivot only once
    if (!pivotRef.current) {
      pivotRef.current = new TransformNode("cameraPivot", scene);
      cameraRef.current.parent = pivotRef.current;
    }

    // Don't recreate tween if it's already running
    if (rotationTweenRef.current && rotationTweenRef.current.isActive()) return;

    // Use a fixed x tilt without accumulation
    pivotRef.current.rotation.x = -Math.PI * 0.05;

    // Infinite smooth rotation
    rotationTweenRef.current = gsap.to(pivotRef.current.rotation, {
      y: "+=" + Math.PI * 2,
      duration: 45,
      ease: "linear",
      repeat: -1,
    });
  }

  function stopCameraRotation(onComplete?: () => void) {
    if (rotationTweenRef.current) {
      rotationTweenRef.current.kill();
      rotationTweenRef.current = null;
    }

    if (pivotRef.current) {
      // Smoothly reset pivot rotation before detaching camera
      gsap.to(pivotRef.current.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1,
        ease: "power2.out",
        onComplete: () => {
          if (cameraRef.current) {
            cameraRef.current.parent = null; // Detach AFTER reset
          }
          if (onComplete) onComplete();
        },
      });
    } else {
      // If pivot doesn't exist, just detach instantly
      if (cameraRef.current) {
        cameraRef.current.parent = null;
      }
      if (onComplete) onComplete();
    }
  }

  function resetCamera() {
    if (!cameraRef.current) return;

    // Stop rotation gracefully first, then animate camera reset
    stopCameraRotation(() => {
      gsap.to(cameraRef.current, {
        alpha: Math.PI / 2,
        beta: Math.PI / 3 + 0.16,
        radius: 6.4,
        duration: 1.5,
        ease: "power2.out",
      });

      gsap.to(cameraRef.current?.target!, {
        x: 0,
        y: 1.5,
        z: 0,
        duration: 1.5,
        ease: "power2.out",
      });
    });
  }

  return {
    camera: cameraRef.current,
    currentMode,
    setCurrentMode,
    cameraRotate,
    stopCameraRotation,
    resetCamera,
  };
}

// const cameraData = {
//   /*
// CORNER BOTTOM VIEW===============================
// camera.ts:69 Camera Position: _Vector3 {_isDirty: true, _x: 8.591748965754892, _y: 2.0550811574121353, _z: -12.086692062518228}
// camera.ts:70 Camera Target: _Vector3 {_isDirty: true, _x: -0.27621617388027525, _y: -0.0031542773750111433, _z: -2.8291907051037772, _gsap: GSCache2}
// camera.ts:71 Camera Alpha: -0.8068859558963444
// camera.ts:72 Camera Beta: 1.4116011358873708
// camera.ts:73 Camera Radius: 12.983777193302743
//   */
// };

// Camera Position: _Vector3 {_isDirty: true, _x: -0.015908417758693286, _y: 3.268071271524756, _z: 7.8094679851265045}
// camera.ts:70 Camera Target: _Vector3 {_isDirty: true, _x: -0.015908417758693765, _y: 1.4941493654251101, _z: 0.008621808521058327, _gsap: GSCache2}
// camera.ts:71 Camera Alpha: 1.5707963267948966
// camera.ts:72 Camera Beta: 1.3471975511965977
// camera.ts:73 Camera Radius: 8
