import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { AbstractMesh } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math";

/**
 * Score display on paddle face using dynamic texture
 * Clean and performant approach
 */
export class ScoreText3D {
  private scene: Scene;
  private textPlane: AbstractMesh | null = null;
  private material!: StandardMaterial;
  private texture!: DynamicTexture;
  private currentScore: number = -1;
  
  constructor(scene: Scene) {
    this.scene = scene;
    this.createTextPlane();
  }

  /**
   * Create a plane with dynamic texture for text
   */
  private createTextPlane(): void {
    // Create plane for text display
    this.textPlane = MeshBuilder.CreatePlane(
      "scoreTextPlane",
      { width: 2, height: 1 },
      this.scene
    );

    // Create dynamic texture for drawing text
    this.texture = new DynamicTexture(
      "scoreTexture",
      { width: 512, height: 256 },
      this.scene,
      false
    );

    // Create material with the texture
    this.material = new StandardMaterial("scoreTextMat", this.scene);
    this.material.diffuseTexture = this.texture;
    this.material.emissiveTexture = this.texture;
    this.material.opacityTexture = this.texture;
    this.material.backFaceCulling = false;
    
    if (this.textPlane) {
      this.textPlane.material = this.material;
    }
  }

  /**
   * Update the displayed score on paddle face
   */
  public updateScore(score: number, position: Vector3, rotation: Vector3): void {
    if (!this.textPlane || score === this.currentScore) return;
    
    this.currentScore = score;

    // Position the plane on paddle face
    this.textPlane.position.copyFrom(position);
    this.textPlane.rotation.copyFrom(rotation);

    // Draw score text on texture
    const ctx = this.texture.getContext();
    const size = this.texture.getSize();
    
    // Clear previous text
    ctx.clearRect(0, 0, size.width, size.height);
    
    // Set text style - large, bold, centered
    ctx.font = "bold 180px Arial";
    ctx.fillStyle = "#FFC720"; // Yellow/gold color
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add text glow effect
    ctx.shadowColor = "rgba(255, 199, 32, 0.8)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw the score
    ctx.fillText(score.toString(), size.width / 2, size.height / 2);
    
    // Update texture
    this.texture.update();
  }

  /**
   * Hide text plane
   */
  public hide(): void {
    if (this.textPlane) {
      this.textPlane.isVisible = false;
    }
  }

  /**
   * Show text plane
   */
  public show(): void {
    if (this.textPlane) {
      this.textPlane.isVisible = true;
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.textPlane) {
      this.textPlane.dispose();
    }
    this.texture.dispose();
    this.material.dispose();
  }
}
