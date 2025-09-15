import { BasePaddle } from "./Paddle";
import {
  Vector3,
  Scene,
  StandardMaterial,
  Color3,
  Texture,
  AbstractMesh,
} from "@babylonjs/core";
import { Vec3 } from "@/types/network";

type PaddleSide = "LEFT" | "RIGHT";

interface PaddleOptions {
  color?: { r: number; g: number; b: number }; // diffuseColor
  textureUrl?: string;
}
export class Paddle extends BasePaddle {
  public side: PaddleSide;
  private textureOverlay: AbstractMesh | null = null;
  private options?: PaddleOptions;
  public isLocal: boolean = false;

  // Cursor tracking
  private previousPos: Vec3 | null = null;
  private clampedX = 0;
  private clampedZ = 0;

  constructor(
    scene: Scene,
    side: PaddleSide,
    isLocal: boolean = false,
    options?: PaddleOptions
  ) {
    super(scene);
    this.side = side;
    this.isLocal = isLocal;
    this.options = options;
  }

  async Load(): Promise<void> {
    await super.load();
    this.setupInitialPosition();

    if (this.options) {
      this.setTexture(
        this.options.textureUrl || null,
        this.options.color
          ? new Color3(
              this.options.color.r,
              this.options.color.g,
              this.options.color.b
            )
          : undefined
      );
    }

    if (this.isLocal) {
      this.enableMouseTracking();
    }
  }

  private setupInitialPosition() {
    if (!this.mesh) return;
    // Example starting positions per side
    this.mesh.position.set(this.side === "LEFT" ? 4.4 : -4.4, 2.5, 0);
  }

  private enableMouseTracking() {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    this.scene.onBeforeRenderObservable.add(() => {
      if (!this.isLocal || !this.mesh) return;

      const bounds = this.getBoundaries();

      // Convert pointer coordinates to normalized device coordinates (-1 to 1)
      const ndcY = 1 - (this.scene.pointerY / canvas.height) * 2;

      // Map NDC Y to world Z (forward/back)
      this.clampedZ =
        bounds.z.min + ((ndcY + 1) / 2) * (bounds.z.max - bounds.z.min);

      // Keep X fixed at initial side position
      this.clampedX = this.side === "LEFT" ? 4.4 : -4.4;

      this.updatePosition();
    });
  }

  private updatePosition() {
    if (!this.mesh) return;

    const targetPos = new Vector3(
      this.clampedX,
      this.mesh.position.y,
      this.clampedZ
    );
    const interpolated = Vector3.Lerp(this.mesh.position, targetPos, 0.5);
    this.mesh.position.copyFrom(interpolated);
  }

  getVelocity(): Vector3 {
    if (!this.mesh) return Vector3.Zero();

    const pos = this.mesh.position.clone();
    if (!this.previousPos) {
      this.previousPos = { x: pos.x, y: pos.y, z: pos.z };
      return Vector3.Zero();
    }

    const vel = new Vector3(
      pos.x - this.previousPos.x,
      pos.y - this.previousPos.y,
      pos.z - this.previousPos.z
    );

    this.previousPos = { x: pos.x, y: pos.y, z: pos.z };
    return vel;
  }

  private getBoundaries() {
    return {
      x: { min: -5, max: 5 }, // still used if needed for other logic
      z: { min: -2, max: 2 }, // forward/back limits
    };
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
