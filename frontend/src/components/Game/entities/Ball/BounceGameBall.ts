import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { AbstractMesh, Quaternion } from "@babylonjs/core";

/**
 * Simple ball for Bounce game - a sphere with cross texture
 * Optimized for performance with minimal geometry
 */
export class BounceGameBall {
  mesh!: AbstractMesh;
  private readonly scene: Scene;
  private readonly radius: number = 0.5; // Match BOUNCE_GAME_BALL.radius
  private readonly textureUrl: string = "/models/cross.jpg";

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Create a simple sphere mesh with cross texture
   * Uses optimized segments for good balance between quality and performance
   */
  Load(): void {
    try {
      // Create sphere with 20 segments for smooth appearance
      this.mesh = MeshBuilder.CreateSphere(
        "bounceBall",
        {
          diameter: this.radius * 2,
          segments: 20, // Good balance of quality and performance
        },
        this.scene
      );

      // Apply cross texture with optimized material
      const material = new StandardMaterial("bounceBallMat", this.scene);
      const texture = new Texture(this.textureUrl, this.scene);
      texture.uScale = 1;
      texture.vScale = 1;
      
      material.diffuseTexture = texture;
      material.specularColor.set(0.3, 0.3, 0.3); // Nice shine
      material.emissiveColor.set(0.1, 0.1, 0.1); // Slight glow for visibility
      material.backFaceCulling = true; // Performance optimization
      
      this.mesh.material = material;
      this.mesh.rotationQuaternion = new Quaternion();

      console.log("Bounce ball created with cross texture");
    } catch (error) {
      console.error("Error creating bounce ball:", error);
    }
  }

  /**
   * Set the mesh position
   */
  setMeshPosition(x: number, y: number, z: number): void {
    if (this.mesh) {
      this.mesh.position.set(x, y, z);
    }
  }

  /**
   * Get the mesh instance
   */
  getMesh(): AbstractMesh {
    return this.mesh;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.mesh) {
      this.mesh.material?.dispose();
      this.mesh.dispose();
    }
  }
}
