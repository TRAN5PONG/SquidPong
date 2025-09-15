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

  setColor(color: Color3) {
    if (!this.mainMesh) return;

    let mat = this.mainMesh.material as StandardMaterial;
    if (!mat || !(mat instanceof StandardMaterial)) {
      mat = new StandardMaterial("paddleMat", this.scene);
      this.mainMesh.material = mat;
    }

    mat.diffuseColor = color.clone();
  }

  setTexture(url: string | null, color?: Color3) {
    if (!this.mainMesh) return;

    // Reuse existing material if possible
    let mat = this.mainMesh.material as StandardMaterial;

    if (!mat || !(mat instanceof StandardMaterial)) {
      mat = new StandardMaterial("paddleMat", this.scene);
      this.mainMesh.material = mat;
    }

    // Reset texture if null
    if (!url) {
      mat.diffuseTexture = null;
      if (color) {
        mat.diffuseColor = color.clone();
      }
      return;
    }

    try {
      const tex = new Texture(url, this.scene);

      tex.hasAlpha = true;
      tex.uAng = 0; // texture rotation if needed
      tex.vAng = 0;

      // Apply both color + texture
      mat.diffuseTexture = tex;
      mat.useAlphaFromDiffuseTexture = true;
      mat.opacityTexture = null; // don’t make paddle transparent
      mat.diffuseTexture.level = 1; // texture intensity

      if (color) {
        mat.diffuseColor = color.clone(); // tint under texture
      } else {
        mat.diffuseColor = new Color3(1, 1, 1); // white base if no color provided
      }

      console.log("Texture and color applied successfully");
    } catch (error) {
      console.error("Error applying texture:", error);
    }
  }
}
