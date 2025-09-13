import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math";

export abstract class Camera {
  protected camera: ArcRotateCamera;

  constructor(scene: Scene) {
    // We'll defer actual position & target to derived class
    this.camera = new ArcRotateCamera("camera", 0, 0, 1, Vector3.Zero(), scene);

    // common config
    this.camera.allowUpsideDown = false;
    this.camera.lowerRadiusLimit = 2;
    this.camera.upperRadiusLimit = 20;
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
