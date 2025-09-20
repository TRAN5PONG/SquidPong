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
  private clampedX = 0;
  private clampedZ = 0;

  // prev and current Positions
  private prev_pos: Vector3 = Vector3.Zero();
  private current_pos: Vector3 = Vector3.Zero();

  // prev and current Rotations
  private prev_rot: Vector3 = Vector3.Zero();
  private current_rot: Vector3 = Vector3.Zero();

  // Targets
  private targetPos: Vector3;
  private targetRot: Vector3;

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
      this.applyStyle(this.options);
    }

    if (this.isLocal) {
      this.enableMouseTracking();
    }
  }

  private setupInitialPosition() {
    if (!this.mesh) return;
    const zPos = this.side === "LEFT" ? -2.8 : 2.8;
    this.mesh.position.set(0, 2.6, zPos);
    this.mesh.rotation.set(0, 0, 0);
  }

  private enableMouseTracking() {
    this.scene.onPointerMove = (evt) => {
      if (!this.isLocal || !this.mesh) return;
      const camera = this.scene.activeCamera;
      if (!camera) return;

      const boundaries = this.getBoundaries();
      const ray = this.scene.createPickingRay(
        evt.offsetX,
        evt.offsetY,
        null,
        camera
      );
      const paddleY = 2.6;
      if (Math.abs(ray.direction.y) > 0.0001) {
        const t = (paddleY - ray.origin.y) / ray.direction.y;
        const worldX = ray.origin.x + t * ray.direction.x;
        const worldZ = ray.origin.z + t * ray.direction.z;
        this.clampedX = worldX;
        this.clampedZ = this.clampedZ = Math.max(
          boundaries.z.min,
          Math.min(boundaries.z.max, worldZ)
        );
      }
    };
  }

  public update() {
    if (!this.mesh) return;

    const targetPos = new Vector3(
      this.clampedX,
      this.mesh.position.y,
      this.clampedZ
    );
    const interpolated = Vector3.Lerp(this.mesh.position, targetPos, 0.6);
    this.mesh.position.copyFrom(interpolated);
    this.setupMouseRotation();
  }

  setupMouseRotation(): void {
    if (!this.mesh) return;

    const boundaries = this.getBoundaries();
    const maxRotation = Math.PI / 2;

    const x = this.mesh.position.x;

    const clampedX = Math.max(boundaries.x.min, Math.min(boundaries.x.max, x));

    // Convert X to a percentage between -1 (left) and +1 (right)
    const pct =
      (clampedX - boundaries.x.min) / (boundaries.x.max - boundaries.x.min); // 0..1
    const centered = pct * 2 - 1; // -1..+1

    this.mesh.rotation.z = centered * -maxRotation;
  }

  private getBoundaries() {
    return {
      x: { min: -3, max: 3 },
      z: this.side === "LEFT" ? { min: -5, max: -1.5 } : { min: 1.5, max: 5 },
    };
  }

  getMeshPosition() {
    if (!this.mesh) return Vector3.Zero();
    return this.mesh.position.clone();
  }
  setMeshPosition() {
    if (!this.mesh) return;

    // Smooth interpolation
    const interpolated = Vector3.Lerp(
      this.mesh.position,
      new Vector3(this.clampedX, this.mesh.position.y, this.clampedZ),
      0.5
    );
    this.mesh.position.copyFromFloats(
      interpolated.x,
      interpolated.y,
      interpolated.z
    );
  }
  getMeshRotation() {
    if (!this.mesh) return Vector3.Zero();
    return this.mesh.rotation.clone();
  }

  private applyStyle(options: PaddleOptions) {
    if (!this.mainMesh) return;

    // Apply color (like setColor)
    if (options.color) {
      let mat = this.mainMesh.material as StandardMaterial;

      if (!mat || !(mat instanceof StandardMaterial)) {
        mat = new StandardMaterial("paddleMat", this.scene);
        this.mainMesh.material = mat;
      }

      mat.diffuseColor = new Color3(
        options.color.r,
        options.color.g,
        options.color.b
      );
    }

    // Apply texture (like setTexture)
    if (options.textureUrl) {
      // Clean up existing overlay
      this.textureOverlay?.dispose();
      this.textureOverlay = null;

      try {
        const mat = new StandardMaterial("paddleTexMat", this.scene);
        const tex = new Texture(options.textureUrl, this.scene);

        tex.hasAlpha = true;
        mat.diffuseTexture = tex;
        mat.useAlphaFromDiffuseTexture = true;
        mat.backFaceCulling = false; // <- texture on both sides

        // Overlay trick to preserve base color + add texture
        const clone = this.mainMesh.clone(
          "paddleOverlay",
          this.mainMesh.parent
        );
        if (clone) {
          clone.position = this.mainMesh.position.clone();
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

  // For position interpolation
  getPrevPosition(): Vector3 {
    return this.prev_pos;
  }
  getCurrentPosition(): Vector3 {
    return this.current_pos;
  }
  setPosition(type: "PREV" | "CURR"): void {
    if (type === "PREV") this.prev_pos = this.mesh.position.clone();
    else this.current_pos = this.mesh.position.clone();
  }

  // For Rotation interpolation
  getPrevRotation(): Vector3 {
    return this.prev_rot;
  }
  getCurrentRotation(): Vector3 {
    return this.current_rot;
  }
  setRotation(type: "PREV" | "CURR"): void {
    if (type === "PREV") this.prev_rot = this.mesh.rotation.clone();
    else this.current_rot = this.mesh.rotation.clone();
  }

  // set ana get Target position and rotation
  setTarget(pos: Vec3, rotZ: number): void {
    this.targetPos = new Vector3(pos.x, pos.y, pos.z);
    this.targetRot = new Vector3(0, 0, rotZ);
  }
  getTarget(): { pos: Vector3; rot: Vector3 } {
    return { pos: this.targetPos, rot: this.targetRot };
  }
}
