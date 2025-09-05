import { useEffect, useRef, useState } from "@/lib/Zeroact";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { LensRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/lensRenderingPipeline";
import gsap, { Power4, Power2 } from "gsap";
import { TransformNode } from "@babylonjs/core";
import "@babylonjs/inspector";

import { MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";

function createDebugDot(
  scene: Scene,
  position: Vector3,
  color = Color3.Red(),
  size = 0.1
) {
  const dot = MeshBuilder.CreateSphere("debugDot", { diameter: size }, scene);
  dot.position.copyFrom(position);

  const mat = new StandardMaterial("debugMat", scene);
  mat.emissiveColor = color; // Bright and unlit
  mat.disableLighting = true;

  dot.material = mat;
  return dot;
}

export type CameraModeName =
  | "pov Left"         // Player's left-side view (first-person/close third-person)
  | "pov Right"        // Player's right-side view
  | "overview Center"  // Center-wide third-person view
  | "overview Top"     // Top-down tactical view
  | "corner Left"      // Diagonal corner view from the left
  | "corner Right";    // Diagonal corner view from the right

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
  }
];

export function useCamera(
  scene: Scene,
  side: number,
  canvas?: HTMLCanvasElement
) {
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const [currentMode, setCurrentMode] = useState<CameraModeName>("pov Left");

  useEffect(() => {
    if (!scene || !canvas) return;

    // Set initial camera mode based on side
    const selectedModeConf = cameraModes.find((m) => m.mode_name === currentMode);
    const alpha = selectedModeConf!.alpha;
    const beta = selectedModeConf!.beta;
    const radius = selectedModeConf!.radius;
    const target = selectedModeConf!.target || new Vector3(0, 1.5, 0); // Default target position

    const camera = new ArcRotateCamera(
      "camera",
      alpha, // alpha : angle around target
      beta, // beta : angle from target
      radius, // radius : distance from target
      target, // target position
      scene
    );

    // createDebugDot(scene, target, Color3.Green(), 0.2);

    // Recommended realistic LensRenderingPipeline parameters
    const parameters = {
      edge_blur: 0.5,
      chromatic_aberration: 1.0,
      distortion: 0.2,
      dof_focus_distance: 100, // higher = farther depth blur focus
      dof_aperture: 0.1, // lower = stronger blur
      dof_pentagon: true,
      grain_amount: 0.3,
      dof_gain: 1.0,
      dof_threshold: 1.0,
      blur_noise: true,
    };

    // scene.debugLayer.show({
    //   embedMode: true, // Optional: show inline
    // });

    // const lensEffect = new LensRenderingPipeline(
    //   "lensEffects",
    //   parameters,
    //   scene,
    //   1.0,
    //   [camera]
    // );

    // scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(
    //   "lensEffects",
    //   camera
    // );

    camera.attachControl(canvas, true);
    scene.activeCamera = camera;

    // camera.onViewMatrixChangedObservable.add(() => {
    //   console.log("===============================");
    //   console.log("Camera Position:", camera.position);
    //   console.log("Camera Target:", camera.target);
    //   console.log("Camera Alpha:", camera.alpha);
    //   console.log("Camera Beta:", camera.beta);
    //   console.log("Camera Radius:", camera.radius);
    // });

    // gsap.to(camera.target, {
    //   duration: 4.5,
    //   y: 1.4941493654251101 - 2.5,
    //   ease: "power4.out",
    // });



    cameraRef.current = camera;
    return () => {
      // Proper cleanup
      // lensEffect.dispose();
      camera.dispose();
      cameraRef.current = null;
    };
  }, [scene, side, canvas]);

  useEffect(() => {
    if (!cameraRef.current) return;
    console.log("Setting camera mode:", currentMode);
    // Set initial camera mode
    setCameraMode(currentMode);
  }, [currentMode]);

  function setCameraMode(mode: CameraModeName) {
    const config = cameraModes.find((m) => m.mode_name === mode);
    const camera = cameraRef.current;

    if (!camera || !config) return;

    gsap.to(camera, {
      alpha: config.alpha,
      beta: config.beta,
      radius: config.radius,
      duration: 1.5,
      ease: "power2.out",
    });

    if (config.target) {
      gsap.to(camera.target, {
        x: config.target.x,
        y: config.target.y,
        z: config.target.z,
        duration: 1.5,
        ease: "power2.out",
      });
    }
  }

  function cameraRotate() {
        // continuos camera rotation
    const cameraPivot = new TransformNode("cameraPivot", scene);
    cameraRef.current!.parent = cameraPivot;

    gsap.to(cameraPivot.rotation, {
      y: "+=" + Math.PI * 2,
      x: "-=" + Math.PI * 0.05,
      duration: 45,
      ease: "linear",
      repeat: -1,
    });
  }

  return {
    camera: cameraRef.current,
    currentMode,
    setCurrentMode,
    cameraRotate
  };
}

const cameraData = {
  /*
CORNER BOTTOM VIEW===============================
camera.ts:69 Camera Position: _Vector3 {_isDirty: true, _x: 8.591748965754892, _y: 2.0550811574121353, _z: -12.086692062518228}
camera.ts:70 Camera Target: _Vector3 {_isDirty: true, _x: -0.27621617388027525, _y: -0.0031542773750111433, _z: -2.8291907051037772, _gsap: GSCache2}
camera.ts:71 Camera Alpha: -0.8068859558963444
camera.ts:72 Camera Beta: 1.4116011358873708
camera.ts:73 Camera Radius: 12.983777193302743
  */
};

// Camera Position: _Vector3 {_isDirty: true, _x: -0.015908417758693286, _y: 3.268071271524756, _z: 7.8094679851265045}
// camera.ts:70 Camera Target: _Vector3 {_isDirty: true, _x: -0.015908417758693765, _y: 1.4941493654251101, _z: 0.008621808521058327, _gsap: GSCache2}
// camera.ts:71 Camera Alpha: 1.5707963267948966
// camera.ts:72 Camera Beta: 1.3471975511965977
// camera.ts:73 Camera Radius: 8
