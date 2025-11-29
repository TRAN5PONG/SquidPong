import {
  Scene,
  TransformNode,
  AbstractMesh,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";

export class BounceGamePaddle {
  scene: Scene;
  protected mainMesh!: AbstractMesh;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async load(): Promise<void> {
    try {
      const container = await LoadAssetContainerAsync(
        "/models/BouncePaddle.glb",
        this.scene
      );

      if (!container || !container.meshes) {
        throw new Error("Failed to load paddle model");
      }

      container.addAllToScene();
      const group = new TransformNode("PaddleGroup", this.scene);

      this.mainMesh =
        container.meshes.find((m) => m.name.toLowerCase().includes("paddle")) ||
        container.meshes[0];

      this.mainMesh = group;
      this.setupInitialPosition();
    } catch (err) {
      console.error("Error loading paddle model:", err);
    }
  }
  private setupInitialPosition() {
    if (!this.mainMesh) return;
    this.mainMesh.scaling.set(0.15, 0.15, 0.15);
    this.mainMesh.position.set(-4, 1, 0);
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

  getMeshPosition() {
    if (!this.mesh) return Vector3.Zero();
    return this.mesh.position.clone();
  }
  getMeshRotation() {
    if (!this.mesh) return Vector3.Zero();
    return this.mesh.rotation.clone();
  }
}
