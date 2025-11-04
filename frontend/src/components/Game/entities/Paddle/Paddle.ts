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
        this.scene,
      );
      if (!container || !container.meshes) {
        throw new Error("Failed to load paddle model");
      }

      container.addAllToScene();
      const group = new TransformNode("PaddleGroup", this.scene);

      container.meshes.forEach((mesh) => {
        if (!mesh || mesh.name === "__root__") return;
        mesh.parent = group;
        if (mesh.name === "faces") {
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

      // custom scaling (size adjustment)
      // this.mesh.scaling.scaleInPlace(1.2);
    } catch (err) {
      console.error("Error loading paddle model:", err);
    }
  }

  setColor(HexColor: string) {
    if (!this.mainMesh) return;
    const color: Color3 = this.hextoColor3(HexColor);

    let mat = this.mainMesh.material as StandardMaterial;
    if (!mat || !(mat instanceof StandardMaterial)) {
      mat = new StandardMaterial("paddleMat", this.scene);
      this.mainMesh.material = mat;
    }

    mat.diffuseColor = color.clone();
  }
  setTexture(url: string | null) {
    if (!this.mainMesh) return;

    // Remove any previous texture mesh
    if (this.textureMesh) {
      this.textureMesh.dispose();
      this.textureMesh = null;
    }

    // Get current base color
    const baseMat = this.mainMesh.material as StandardMaterial;
    const color = baseMat?.diffuseColor || new Color3(0.949, 0.173, 0.173);

    // Restore base color only (no texture)
    if (!url) {
      const colorMat = new StandardMaterial("paddleColorMat", this.scene);
      colorMat.diffuseColor = color.clone();
      colorMat.specularColor = new Color3(0, 0, 0);
      this.mainMesh.material = colorMat;
      return;
    }

    // Set the base mesh to pure solid color (no texture)
    const colorMat = new StandardMaterial("paddleColorMat", this.scene);
    colorMat.diffuseColor = color.clone();
    colorMat.specularColor = new Color3(0, 0, 0);
    this.mainMesh.material = colorMat;

    // Clone the mesh for texture overlay
    this.textureMesh = this.mainMesh.clone(
      "faces",
      this.mainMesh.parent,
      false,
    );
    this.textureMesh.parent = this.mainMesh.parent;

    // Position slightly in front to avoid z-fighting
    this.textureMesh.position.z = 0.001; // Tiny offset

    // Create texture-only material
    const textureMat = new StandardMaterial("paddleTextureMat", this.scene);
    textureMat.diffuseTexture = new Texture(url, this.scene);
    textureMat.diffuseTexture.hasAlpha = true;
    textureMat.useAlphaFromDiffuseTexture = true;

    // Make the base color white so texture shows as-is
    textureMat.diffuseColor = new Color3(1, 1, 1);
    textureMat.specularColor = new Color3(0, 0, 0);
    textureMat.backFaceCulling = false;

    // Enable transparency blending
    textureMat.alpha = 1.0;

    this.textureMesh.material = textureMat;

    // Ensure proper rendering order (texture on top of color)
    this.mainMesh.renderingGroupId = 0;
    this.textureMesh.renderingGroupId = 0;
    this.textureMesh.alphaIndex = 1; // Render after base mesh
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
