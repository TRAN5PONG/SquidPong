import { Scene, Vector3 } from "@babylonjs/core";
import { Camera } from "./Camera";

export class PaddleCamera extends Camera {
  constructor(scene: Scene) {
    super(scene);
    this.setupPosition();
  }

  public setupPosition(): void {
    const cam = this.getCamera();

    cam.alpha = Math.PI / 2;
    cam.beta = Math.PI / 2;
    cam.radius = 2;
    cam.setTarget(Vector3.Zero());
  }
}
