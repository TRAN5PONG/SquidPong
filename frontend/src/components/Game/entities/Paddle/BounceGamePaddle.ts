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
  public mesh!: TransformNode;

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
      
      // Find the main paddle mesh (like original: find mesh with "paddle" in name)
      this.mainMesh = 
        container.meshes.find((m: any) => m.name.toLowerCase().includes("paddle")) || 
        container.meshes[0];

      // Store reference - the mainMesh IS the paddle (like original)
      this.mesh = this.mainMesh as any;
      
      this.setupInitialPosition();
    } catch (err) {
      console.error("Error loading paddle model:", err);
    }
  }

  private setupInitialPosition() {
    if (!this.mesh) return;
    // Scale exactly like original Bounce-pong-3D
    this.mesh.scaling.set(0.15, 0.15, 0.15);
    // Position exactly like original
    this.mesh.position.set(-4, 1, 0);
  }

  public updateVisual(pos: Vector3): void {
    if (!this.mesh) return;
    this.mesh.position.set(pos.x, pos.y, pos.z);
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
