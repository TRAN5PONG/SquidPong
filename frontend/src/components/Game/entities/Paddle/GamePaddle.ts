import { BasePaddle } from "./Paddle";
import { Scene } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PaddleColor, PaddleTexture } from "@/types/game/paddle";

type PaddleSide = "LEFT" | "RIGHT";

interface PaddleOptions {
  color?: PaddleColor;
  texture?: PaddleTexture;
}
export class Paddle extends BasePaddle {
  public side: PaddleSide;
  private options?: PaddleOptions;
  public isLocal: boolean = false;

  constructor(
    scene: Scene,
    side: PaddleSide,
    isLocal: boolean = false,
    options?: PaddleOptions,
  ) {
    super(scene);
    this.side = side;
    this.isLocal = isLocal;
    this.options = options;
  }

  async Load(): Promise<void> {
    await super.load();
    this.setupInitialPosition();

    if (this.mesh && this.isLocal) {
      this.mesh.getChildMeshes().forEach((mesh) => {
        // Always render paddles on top layer
        mesh.renderingGroupId = 2;
      });
    }
    if (this.options) {
      if (this.options.color) {
        this.setColor(this.options.color.color);
      }
      if (this.options.texture) {
        this.setTexture(this.options.texture.image);
      }
    }
  }

  private setupInitialPosition() {
    if (!this.mesh) return;
    const zPos = this.side === "LEFT" ? -2.8 : 2.8;
    this.mesh.position.set(0, 2.8, zPos);
    this.mesh.rotation.set(0, 0, 0);
  }

  public updateVisual(pos: Vector3): void {
    this.mesh.position.set(pos.x, pos.y, pos.z);

    const boundaries = this.getBoundaries();
    const pct =
      (pos.x - boundaries.x.min) / (boundaries.x.max - boundaries.x.min);
    const centered = pct * 2 - 1;
    const targetRot = centered * -(Math.PI / 2);
    this.mesh.rotation.z = targetRot;
  }

  public updatePaddlePosition(x: number, y: number, z: number) {
    if (!this.mesh) return;

    this.mesh.position.set(x, y, z);
  }

  public getBoundaries() {
    return {
      x: { min: -3, max: 3 },
      z: this.side === "LEFT" ? { min: -8, max: -1.5 } : { min: 1.5, max: 8 },
    };
  }

  getMeshPosition() {
    if (!this.mesh) return Vector3.Zero();
    return this.mesh.position.clone();
  }
  getMeshRotation() {
    if (!this.mesh) return Vector3.Zero();
    return this.mesh.rotation.clone();
  }
}
