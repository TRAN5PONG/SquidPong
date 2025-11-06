import { useEffect, useState } from "@/lib/Zeroact";
import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { AbstractMesh, Vector3 } from "@babylonjs/core";
import { TrailMesh } from "@babylonjs/core/Meshes/trailMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { Vec3 } from "@/types/network";

export class Ball {
  private meshGroup: TransformNode | null = null;
  private readonly scene: Scene;
  mesh!: AbstractMesh;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  async Load(): Promise<void> {
    try {
      const container = await LoadAssetContainerAsync(
        "/models/ball.glb",
        this.scene,
      );
      container.addAllToScene();

      const group = new TransformNode("BallGroup", this.scene);
      container.meshes.forEach((mesh) => {
        if (mesh.name !== "__root__") {
          mesh.parent = group;
          this.mesh = mesh;
        }
      });

      // ✅ Add Trail
      const trail = new TrailMesh(
        "ballTrail",
        this.mesh,
        this.scene,
        0.03,
        10,
        true,
      );
      const trailMat = new StandardMaterial("trailMat", this.scene);
      trailMat.emissiveColor = new Color3(1, 1, 1); // white glow
      trail.material = trailMat;

      const glow = new GlowLayer("glow", this.scene);
      glow.intensity = 0;

      this.meshGroup = group;

      this.mesh.scaling.scaleInPlace(2);
    } catch (error) {
      console.error("Error loading ball model:", error);
    }
  }

  setMeshPosition(pos: Vector3): void {
    if (this.mesh) this.mesh.position.copyFrom(pos);
  }

  getMeshPosition(): Vector3 {
    if (!this.mesh) return Vector3.Zero();
    return this.mesh.position.clone();
  }

  reset(): void {
    this.setMeshPosition(Vector3.Zero());
  }
}
