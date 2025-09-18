import { Scene, Vector3 } from "@babylonjs/core";
import { Camera } from "./Camera";

export class GameCamera extends Camera {
  private playerSide: number;

  constructor(scene: Scene, playerSide: number) {
    super(scene);
    this.playerSide = playerSide;
    this.setupPosition();
  }

  protected setupPosition(): void {
    // Position the camera based on player side
    if (this.playerSide === 1) {
      this.camera.setPosition(new Vector3(10, 5, 0));
      this.camera.setTarget(new Vector3(0, 3, 0));
    } else {
      this.camera.setPosition(new Vector3(-10, 5, 0));
      this.camera.setTarget(new Vector3(0, 3, 0));
    }
  }
}
