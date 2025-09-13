import { Camera, Plane, Scene, Vector3 } from "@babylonjs/core";
import { BasePaddle } from "./Paddle";
import { Vec3 } from "@/types/network";

export class Paddle extends BasePaddle {
  private camera: Camera;
  private isLocal: boolean;
  private side: -1 | 1 = 1;
  private paddlePlane: Plane | null = null;
  private previousPos: Vec3 | null = null;
  private clampedX = 0;
  private clampedZ = 0;

  constructor(scene: Scene, camera: Camera, isLocal = false) {
    super(scene);
    this.isLocal = isLocal;
    this.camera = camera;
  }

  async Load(): Promise<void> {
    await super.load();
    this.setupInitialPosition();

    if (this.isLocal) {
      this.setupPaddlePlane();
      this.enableMouseTracking();
    }
  }

  private setupPaddlePlane() {
    if (!this.mesh) return;
    this.paddlePlane = Plane.FromPositionAndNormal(
      this.mesh.position,
      new Vector3(0, 1, 0)
    );
  }

  private enableMouseTracking() {
    this.scene.onBeforeRenderObservable.add(() => {
      if (!this.isLocal || !this.mesh || !this.paddlePlane) return;

      const ray = this.scene.createPickingRay(
        this.scene.pointerX,
        this.scene.pointerY,
        null,
        this.camera
      );
      const dist = ray.intersectsPlane(this.paddlePlane);
      if (dist === null) return;

      const bounds = this.getBoundaries();
      const point = ray.origin.add(ray.direction.scale(dist));

      this.clampedX = Math.max(bounds.x.min, Math.min(bounds.x.max, point.x));
      this.clampedZ = Math.max(bounds.z.min, Math.min(bounds.z.max, point.z));

      this.updateRotation();
    });
  }

  private setupInitialPosition() {
    if (!this.mesh) return;
    const z = this.side === -1 ? -2.8 : 2.8;
    this.mesh.position.set(0, 2, z);
    this.mesh.rotationQuaternion = null;
    this.mesh.rotation.set(0, 0, 0);
  }

  private updateRotation() {
    if (!this.mesh) return;
    const currX = this.mesh.position.x;
    const bounds = this.getBoundaries();
    const maxRot = Math.PI / 2;
    const gap = 0.1;

    let pct = (bounds.x.max - currX) / (bounds.x.max - bounds.x.min);
    pct = (pct - gap) / (1 - 2 * gap);
    pct = Math.max(0, Math.min(1, pct));

    this.mesh.rotation.z = -maxRot + pct * (2 * maxRot);
  }

  private getBoundaries() {
    return {
      x: { min: -2, max: 2 },
      z: this.side === -1 ? { min: -3.5, max: -1.5 } : { min: 1.5, max: 3.5 },
    };
  }

  setSide(side: -1 | 1) {
    this.side = side;
    this.setupInitialPosition();
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

  updatePosition() {
    if (!this.mesh) return;
    const interpolated = Vector3.Lerp(
      this.mesh.position,
      new Vector3(this.clampedX, this.mesh.position.y, this.clampedZ),
      0.5
    );
    this.mesh.position.copyFrom(interpolated);
  }
}