import {
  Scene,
  TransformNode,
  AbstractMesh,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";

export class BasePaddle {
  mesh!: TransformNode;
  protected mainMesh!: AbstractMesh;
  protected scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async load(): Promise<void> {
    try {
      const container = await LoadAssetContainerAsync(
        "/models/paddle.glb",
        this.scene
      );
      if (!container || !container.meshes) {
        throw new Error("Failed to load paddle model");
      }

      container.addAllToScene();
      const group = new TransformNode("PaddleGroup", this.scene);

      container.meshes.forEach((mesh) => {
        if (!mesh || mesh.name === "__root__") return;
        mesh.parent = group;
        if (mesh.name === "raquette.001_Cover.002_0") {
          this.mainMesh = mesh as AbstractMesh;
        }
        mesh.isPickable = true;
      });

      // Set default material (red)
      if (this.mainMesh) {
        const defaultMat = new StandardMaterial("defaultPaddleMat", this.scene);
        defaultMat.diffuseColor = new Color3(0.949, 0.173, 0.173);
        this.mainMesh.material = defaultMat;
      }

      this.mesh = group;
    } catch (err) {
      console.error("Error loading paddle model:", err);
    }
  }

  getMesh(): AbstractMesh | null {
    return this.mainMesh ?? null;
  }
}