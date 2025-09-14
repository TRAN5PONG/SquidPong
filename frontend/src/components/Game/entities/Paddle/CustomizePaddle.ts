import {
  AbstractMesh,
  Color3,
  Scene,
  StandardMaterial,
  Texture,
} from "@babylonjs/core";
import { BasePaddle } from "./Paddle";

export class CustomizePaddle extends BasePaddle {
  private textureOverlay: AbstractMesh | null = null;
  ready: Promise<void>;
  meshGroup: any;

  constructor(scene: Scene) {
    super(scene);
    this.ready = this.load().then(() => {
      this.meshGroup = this.mesh;
      if (this.meshGroup) {
        this.meshGroup.position.y = -0.2;
        this.meshGroup.rotation.x = -Math.PI / 2;
        this.meshGroup.scaling.scaleInPlace(1.1);
      }
    })
    // Set initial position/rotation
  }

  setColor(color: Color3) {
    if (!this.mainMesh) return;
    console.log("reaches");

    let mat = this.mainMesh.material as StandardMaterial;

    if (!mat || !(mat instanceof StandardMaterial)) {
      mat = new StandardMaterial("paddleMat", this.scene);
      this.mainMesh.material = mat;
    }

    mat.diffuseColor = color.clone();
  }
  setTexture(url: string | null) {
    if (!this.mainMesh) return;

    // Clean up existing overlay
    this.textureOverlay?.dispose();
    this.textureOverlay = null;

    if (!url) return;

    try {
      const mat = new StandardMaterial("paddleTexMat", this.scene);
      const tex = new Texture(url, this.scene);

      tex.hasAlpha = true;
      mat.diffuseTexture = tex;
      mat.useAlphaFromDiffuseTexture = true;
      mat.backFaceCulling = true; // Show texture on both sides

      const clone = this.mainMesh.clone("paddleOverlay", this.mainMesh.parent);
      if (clone) {
        clone.position = this.mainMesh.position.clone();
        // clone.position.z += 0.001;
        clone.rotation = this.mainMesh.rotation.clone();
        clone.scaling = this.mainMesh.scaling.clone();

        clone.material = mat;
        this.textureOverlay = clone;

        console.log("Texture overlay created successfully");
      } else {
        console.error("Failed to clone mesh for texture overlay");
      }
    } catch (error) {
      console.error("Error applying texture:", error);
    }
  }
}
