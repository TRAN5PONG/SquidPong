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
  position?: Vector3;
  target?: Vector3;
}

export const cameraModes: CameraMode[] = [
  {
    mode_name: "pov Left",
    alpha: -1.5598,
    beta: 1.3401,
    radius: 10.9418,
    target: new Vector3(
      0.004868602525412593,
      2.944502329158886,
      -0.44418681285137157
    ),
  },
  {
    mode_name: "pov Right",
    alpha: 1.5598,
    beta: 1.3401,
    radius: 11,
  },
  {
    mode_name: "overview Center",
    alpha: 0,
    beta: 1.3401,
    radius: 11,
  },
  {
    mode_name: "overview Top",
    alpha: 0,
    beta: 0,
    radius: 11,
  },
  {
    mode_name: "corner Left",
    alpha: -2.3294,
    beta: 1.2487,
    radius: 36.6005,
    target: new Vector3(
      -0.4702978770708445,
      0.8746662756753024,
      -0.9455244893600762
    ),
  },
  {
    mode_name: "corner Right",
    alpha: -4.71,
    beta: 1.1584,
    radius: 35,
    target: new Vector3(
      0.04436073557121011,
      4.094313994558129,
      6.929281237043629
    ),
  },
];
export class SpectatorCamera extends Camera {
  private mode: CameraModeName = "pov Left";
  private pivot: TransformNode | null = null;
  private initialized = false;

  constructor(scene: Scene) {
    const initialMode = cameraModes.find((m) => m.mode_name === "pov Left");

    super(
      scene,
      initialMode?.alpha ?? 0,
      initialMode?.beta ?? 0,
      initialMode?.radius ?? 10,
      initialMode?.target ?? Vector3.Zero()
    );

    this.setupPosition();
  }

  public setupPosition(): void {
    this.pivot = new TransformNode("cameraPivot");
    this.getCamera().parent = this.pivot;
    this.applyModeImmediate(this.mode);

    this.initialized = true;
  }

  private applyModeImmediate(mode: CameraModeName) {
    const modeConfig = cameraModes.find((m) => m.mode_name === mode);
    if (!modeConfig) return;

    // set camera parameters directly so the first frame renders correctly
    const cam = this.getCamera();
    cam.alpha = modeConfig.alpha;
    cam.beta = modeConfig.beta;
    cam.radius = modeConfig.radius;
    if (modeConfig.target) {
      cam.setTarget(modeConfig.target.clone());
    } else {
      cam.setTarget(Vector3.Zero());
    }

    // reset any inertial offsets so it doesn't jump
    cam.inertialAlphaOffset = 0;
    cam.inertialBetaOffset = 0;
    cam.inertialRadiusOffset = 0;
  }

  setMode(mode: CameraModeName) {
    this.mode = mode;
    const modeConfig = cameraModes.find((m) => m.mode_name === mode);
    if (!modeConfig) return;

    if (!this.initialized) {
      this.applyModeImmediate(mode);
      return;
    }

    gsap.to(this.getCamera(), {
      alpha: modeConfig.alpha,
      beta: modeConfig.beta,
      radius: modeConfig.radius,
      duration: 1.5,
      ease: "power2.out",
      onComplete: () => {
        const cam = this.getCamera();
        cam.inertialAlphaOffset = 0;
        cam.inertialBetaOffset = 0;
        cam.inertialRadiusOffset = 0;
      },
    });

    if (modeConfig.target) {
      this.getCamera().setTarget(modeConfig.target.clone());
    }
  }

  getMode(): CameraModeName {
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
