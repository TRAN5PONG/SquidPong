import { BasePaddle } from "./Paddle";
import {
  Scene,
  StandardMaterial,
  Color3,
  Texture,
  AbstractMesh,
} from "@babylonjs/core";
import { Vec3 } from "@/types/network";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PaddleColor, PaddleTexture } from "@/types/game/paddle";
import { Paddle as PaddlePhy } from "@/components/Game/physics/Paddle";


type PaddleSide = "LEFT" | "RIGHT";

interface PaddleOptions {
  color?: PaddleColor;
  texture?: PaddleTexture;
}
export class Paddle extends BasePaddle {
  public side: PaddleSide;
  private textureOverlay: AbstractMesh | null = null;
  private options?: PaddleOptions;
  public isLocal: boolean = false;

  // Cursor tracking
  private clampedX = 0;
  private clampedZ = 0;

  // prev Positions
  private prev_pos: Vector3 = Vector3.Zero();

  // prev and current Rotations
  private prev_rot: Vector3 = Vector3.Zero();

  // Targets
  private targetPos: Vector3 = Vector3.Zero();
  private targetRot: Vector3 = Vector3.Zero();

  // Paddle Physics
  public paddle_physics!: PaddlePhy | null;

  constructor(
    scene: Scene,
    side: PaddleSide,
    isLocal: boolean = false,
    paddle_physics: PaddlePhy | null = null,
    options?: PaddleOptions,
  ) {
    super(scene);
    this.side = side;
    this.isLocal = isLocal;
    this.options = options;
    this.paddle_physics = paddle_physics;
  }

  async Load(): Promise<void> {
    await super.load();
    this.setupInitialPosition();

    if (this.options) {
      if (this.options.color) {
        this.setColor(this.options.color.color);
      }
      if (this.options.texture) {
        this.setTexture(this.options.texture.image);
      }
    }

    // Initialize clamped values to paddle's starting position
    this.clampedX = this.mesh?.position.x || 0;
    this.clampedZ =
      this.mesh?.position.z || (this.side === "LEFT" ? -2.8 : 2.8);

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
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (!this.mesh) return;
      const evt = pointerInfo.event;
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
        this.clampedZ = Math.max(
          boundaries.z.min,
          Math.min(boundaries.z.max, worldZ)
        );
      }
    });
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

    if (this.paddle_physics)
      this.paddle_physics.setPaddleTargetPosition(
        interpolated.x,
        interpolated.y,
        interpolated.z
      );
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

  // For position interpolation
  getPrevPosition(): Vector3 {
    return this.prev_pos;
  }
  setPrevPosition(): void {
    this.prev_pos = this.mesh.position.clone();
  }

  // For Rotation interpolation
  getPrevRotation(): Vector3 {
    return this.prev_rot;
  }
  setPrevRotation(): void {
    this.prev_rot = this.mesh.rotation.clone();
  }

  // set and   get Target position and rotation
  setTarget(pos: Vec3, rotZ: number): void {
    this.targetPos = new Vector3(pos.x, pos.y, pos.z);
    this.targetRot = new Vector3(0, 0, rotZ);
  }
  getTarget(): { pos: Vector3; rot: Vector3 } {
    return { pos: this.targetPos, rot: this.targetRot };
  }
}
