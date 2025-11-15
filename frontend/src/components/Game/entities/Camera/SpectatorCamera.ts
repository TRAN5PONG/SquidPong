import { Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { Camera } from "./Camera";
import gsap from "gsap";

export type CameraModeName =
  | "pov Left"
  | "pov Right"
  | "overview Center"
  | "overview Top"
  | "corner Left"
  | "corner Right";

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
    beta: -Math.PI ,
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
export class SpectatorCamera extends Camera {
  private mode: CameraModeName = "overview Center";
  private pivot: TransformNode | null = null;

  constructor(scene: Scene) {
    super(scene);
  }

  // Mode management
  setMode(mode: CameraModeName) {
    this.mode = mode;
    const modeConfig = cameraModes.find((m) => m.mode_name === mode);
    if (modeConfig) {
      // Pivot setup
      if (this.pivot) {
        this.getCamera().parent = this.pivot;
        this.pivot.rotation = new Vector3(0, 0, 0); // Reset pivot rotation
      } else {
        this.getCamera().parent = null; // Ensure no parent
      }
      // Animate camera to new mode
      gsap.to(this.getCamera(), {
        alpha: modeConfig.alpha,
        beta: modeConfig.beta,
        radius: modeConfig.radius,
        duration: 1.5,
        ease: "power2.out",
      });
    }
  }
  getMode() {
	return this.mode;
  }

  dispose() {
	if (this.pivot) {
	  this.pivot.dispose();
	  this.pivot = null;
	}
	super.dispose();
  }
}
