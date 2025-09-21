import {
  Scene,
  TransformNode,
  AbstractMesh,
  StandardMaterial,
  Color3,
  Texture,
} from "@babylonjs/core";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";

export class BasePaddle {
  mesh!: TransformNode;
  protected mainMesh!: AbstractMesh;
  textureMesh: any; // Store the cloned mesh for texture

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
        if (mesh.name === "Paddle_faces") {
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

  setColor(HexColor: string) {
    if (!this.mainMesh) return;
    const color : Color3 = this.hextoColor3(HexColor);

    let mat = this.mainMesh.material as StandardMaterial;
    if (!mat || !(mat instanceof StandardMaterial)) {
      mat = new StandardMaterial("paddleMat", this.scene);
      this.mainMesh.material = mat;
    }

    mat.diffuseColor = color.clone();
  }
  setTexture(url: string | null) {
    if (!this.mainMesh) return;

    if (this.textureMesh) {
      this.textureMesh.dispose();
      this.textureMesh = null;
    }
    if (!url) return;

    const textureMat = new StandardMaterial("textureMat", this.scene);
    const texture = new Texture(url, this.scene);

    texture.hasAlpha = true;
    texture.uScale = 1.0;
    texture.vScale = 1;
    texture.uOffset = 0.0;
    texture.vOffset = 0.0;

    textureMat.diffuseTexture = texture;
    textureMat.useAlphaFromDiffuseTexture = true;

    // ADD THIS LINE - Disable backface culling to show texture on both sides
    textureMat.backFaceCulling = false;

    // Also add transparency mode
    textureMat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;

    const cloned = this.mainMesh.clone("Paddle_faces", null, false);
    if (cloned) {
      cloned.position.z += 0.001;
      cloned.material = textureMat;
      this.textureMesh = cloned;
    }
  }
  getMesh(): AbstractMesh | null {
    return this.mainMesh ?? null;
  }

  private hextoColor3(hex: string): Color3 {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return new Color3(r, g, b);
  }
}
