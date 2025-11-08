import { BasePaddle } from "./Paddle";
import {
  Scene,
  StandardMaterial,
  Color3,
  Texture,
  AbstractMesh,
  Plane,
  Scalar,
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

  // prev Rotations
  private prev_rot: Vector3 = Vector3.Zero();

  // Targets
  private targetPos: Vector3 = Vector3.Zero();
  private targetRot: Vector3 = Vector3.Zero();

  // Paddle Physics
  public paddle_physics!: PaddlePhy | null;

  // plane for mouse tracking
  private paddlePlane: Plane | null = null;

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

    // Initialize clamped values to paddle's starting position
    this.clampedX = this.mesh?.position.x || 0;
    this.clampedZ =
      this.mesh?.position.z || (this.side === "LEFT" ? -2.8 : 2.8);

    // if (this.isLocal) {
    //   this.setupPaddlePlane();
    //   this.enableLiveMouseTracking();
    // }
  }
  private setupPaddlePlane(): void {
    if (!this.mesh) return;

    const planePosition = new Vector3(0, this.mesh.position.y, 0);
    const planeNormal = new Vector3(0, 1, 0);
    this.paddlePlane = Plane.FromPositionAndNormal(planePosition, planeNormal);
  }

  private setupInitialPosition() {
    if (!this.mesh) return;
    const zPos = this.side === "LEFT" ? -2.8 : 2.8;
    this.mesh.position.set(0, 2.8, zPos);
    this.mesh.rotation.set(0, 0, 0);
  }

  private enableLiveMouseTracking(): void {
    this.scene.onBeforeRenderObservable.add(() => {
      if (!this.mesh || !this.paddlePlane) return;

      const pointerX = this.scene.pointerX;
      const pointerY = this.scene.pointerY;
      if (pointerX === undefined || pointerY === undefined) return;

      const ray = this.scene.createPickingRay(
        pointerX,
        pointerY,
        null,
        this.scene.activeCamera,
      );
      const distance = ray.intersectsPlane(this.paddlePlane);
      if (distance === null) return;

      const boundaries = this.getBoundaries();
      const point = ray.origin.add(ray.direction.scale(distance));

      this.clampedX = Math.max(
        boundaries.x.min,
        Math.min(boundaries.x.max, point.x),
      );
      this.clampedZ = Math.max(
        boundaries.z.min,
        Math.min(boundaries.z.max, point.z),
      );
    });
  }

  public update() {
    if (!this.mesh) return;

    const targetPos = new Vector3(
      this.clampedX,
      this.mesh.position.y,
      this.clampedZ,
    );
    const interpolated = Vector3.Lerp(this.mesh.position, targetPos, 0.8);
    this.mesh.position.copyFrom(interpolated);

    // Smooth rotation
    const boundaries = this.getBoundaries();
    const pct =
      (interpolated.x - boundaries.x.min) /
      (boundaries.x.max - boundaries.x.min);
    const centered = pct * 2 - 1;
    const targetRot = centered * -(Math.PI / 2);
    this.mesh.rotation.z = Scalar.Lerp(this.mesh.rotation.z, targetRot, 0.2);

    // Sync with physics
    this.paddle_physics?.setPaddleTargetPosition(
      interpolated.x,
      interpolated.y,
      interpolated.z,
    );
  }

  // TEST:
  public updateVisual(alpha: number) {
    if (!this.paddle_physics) return;
    const pos = this.paddle_physics.getInterpolatedPos(alpha);
    this.mesh.position.set(pos.x, pos.y, pos.z);

    const boundaries = this.getBoundaries();
    const pct =
      (pos.x - boundaries.x.min) / (boundaries.x.max - boundaries.x.min);
    const centered = pct * 2 - 1;
    const targetRot = centered * -(Math.PI / 2);
    this.mesh.rotation.z = targetRot;
  }

  public getBoundaries() {
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
      0.5,
    );
    this.mesh.position.copyFromFloats(
      interpolated.x,
      interpolated.y,
      interpolated.z,
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
    if (!this.mesh) return;
    this.prev_pos = new Vector3(
      this.mesh.position.x,
      this.mesh.position.y,
      this.mesh.position.z,
    );
  }

  // For Rotation interpolation
  getPrevRotation(): Vector3 {
    return this.prev_rot;
  }
  setPrevRotation(): void {
    if (!this.mesh) return;
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
