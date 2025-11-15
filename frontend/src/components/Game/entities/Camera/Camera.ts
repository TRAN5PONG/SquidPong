import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";

// Camera base
export abstract class Camera {
  protected camera: ArcRotateCamera;

  constructor(
    scene: Scene,
    alpha: number = 0,
    beta: number = 0,
    radius: number = 10,
    target: Vector3 = Vector3.Zero()
  ) {
    this.camera = new ArcRotateCamera(
      "camera",
      alpha,
      beta,
      radius,
      target,
      scene
    );

    this.camera.allowUpsideDown = false;
    this.camera.lowerRadiusLimit = 1;
    this.camera.upperRadiusLimit = 100;
  }

  protected abstract setupPosition(): void;

  getCamera() {
    return this.camera;
  }

  attach(canvas: HTMLCanvasElement) {
    this.camera.attachControl(canvas, true);
  }

  dispose() {
    this.camera.dispose();
  }
}