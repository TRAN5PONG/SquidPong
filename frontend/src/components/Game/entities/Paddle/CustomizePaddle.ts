import { AbstractMesh, Color3, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import { BasePaddle } from "./Paddle";

export class CustomizePaddle extends BasePaddle {
  private textureOverlay: AbstractMesh | null = null;
  meshGroup: any;

  constructor(scene: Scene) {
    super(scene);
  }

  setColor(color: Color3) {
    if (!this.mainMesh) return;
    let mat = this.mainMesh.material as StandardMaterial;
    if (!mat) {
      mat = new StandardMaterial("paddleMat", this.scene);
      this.mainMesh.material = mat;
    }
    mat.diffuseColor = color.clone();
  }

  setTexture(url: string) {
    if (!this.mainMesh) return;

    this.textureOverlay?.dispose();
    this.textureOverlay = null;

    if (!url) return;

    const mat = new StandardMaterial("paddleTexMat", this.scene);
    const tex = new Texture(url, this.scene);
    tex.hasAlpha = true;
    tex.vScale = -1;
    mat.diffuseTexture = tex;
    mat.useAlphaFromDiffuseTexture = true;

    const clone = this.mainMesh.clone("paddleOverlay", null, false);
    if (clone) {
      clone.position.z += 0.001;
      clone.material = mat;
      this.textureOverlay = clone;
    }
  }
}