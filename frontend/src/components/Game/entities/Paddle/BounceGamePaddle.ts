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
      
      this.mainMesh = 
        container.meshes.find((m: any) => m.name.toLowerCase().includes("paddle")) || 
        container.meshes[0];

      this.mesh = this.mainMesh as any;
      
      container.meshes.forEach((mesh: AbstractMesh) => {
        mesh.receiveShadows = true;
        

        if (mesh.material) {
          const mat = mesh.material as any;
          if (mat.disableLighting !== undefined) {
            mat.disableLighting = false;
          }
        }
      });
      
      this.setupInitialPosition();
    } catch (err) {
      console.error("Error loading paddle model:", err);
    }
  }

  private setupInitialPosition() {
    if (!this.mesh) return;
    this.mesh.scaling.set(0.15, 0.15, 0.15);
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.set(0, 0, 0);
  }

  public updateVisual(pos: Vector3): void {
    if (!this.mesh) return;
    this.mesh.position.set(pos.x, pos.y, pos.z);
  }
  
  public setRotation(x: number, y: number, z: number): void {
    if (!this.mesh) return;
    // Keep the base Y rotation (Math.PI) and add the dynamic Z rotation
    this.mesh.rotation.set(x, Math.PI, z);
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
