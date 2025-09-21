import { Color3, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import { BasePaddle } from "./Paddle";

export class CustomizePaddle extends BasePaddle {
  ready: Promise<void>;
  meshGroup: any;

  constructor(scene: Scene) {
    super(scene);
    this.ready = this.load().then(() => {
      this.meshGroup = this.mesh;
      if (this.meshGroup) {
        this.meshGroup.position.y = -0.2;
        this.meshGroup.scaling.scaleInPlace(0.8);

        // Ensure paddle has a StandardMaterial from start
        let mat = this.mainMesh?.material as StandardMaterial;
        if (!mat || !(mat instanceof StandardMaterial)) {
          mat = new StandardMaterial("paddleMat", this.scene);
          this.mainMesh!.material = mat;
        }
      }
    });
  }
}
