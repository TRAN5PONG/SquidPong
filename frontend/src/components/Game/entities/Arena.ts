import { useEffect, useState } from "@/lib/Zeroact";
import {
  Scene,
  TransformNode,
  AbstractMesh,
  LoadAssetContainerAsync,
  DynamicTexture,
  StandardMaterial,
} from "@babylonjs/core";

import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { GridMaterial } from "@babylonjs/materials/grid";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import "@babylonjs/inspector"; // For Babylon.js built-in inspector
import { Light } from "@/components/Game/entities/Light";

export class Arena {
  private Mesh: TransformNode | null = null;
  private Light: Light;
  private scene: Scene;
  private TableBaseMesh: AbstractMesh | null = null;
  private BoardMesh: AbstractMesh | null = null;
  private boardTexture: DynamicTexture | null = null;
  private meshesToCastShadows: string[] = [
    "BedRow_RoofMetal_0",
    "BedRow.001_RoofMetal_0",
    "BedRow.002_RoofMetal_0",
    "BlueWalls_BlueWalls_0",
    "BrickWalls_BrickWalls_0",
  ];
  private meshesToReceiveShadows: string[] = [
    "BlueWalls_BlueWalls_0",
    "BrickWalls_BrickWalls_0",
    "StackableSheets.003_BedSheets_0",
  ];

  constructor(scene: Scene, light: Light) {
    this.scene = scene;
    this.Light = light;
  }

  private initializeBoardText() {
    if (!this.BoardMesh) return;

    // Create a dynamic texture with high resolution for crisp text
    this.boardTexture = new DynamicTexture(
      "boardTexture",
      { width: 1024, height: 512 }, // Adjust based on your board size
      this.scene,
      false // Don't generate mipmaps for sharper text
    );

    // Create or get material
    let material = this.BoardMesh.material as StandardMaterial;
    if (!material || !(material instanceof StandardMaterial)) {
      material = new StandardMaterial("boardMaterial", this.scene);
      this.BoardMesh.material = material;
    }

    // Apply the dynamic texture to the material
    material.diffuseTexture = this.boardTexture;
    material.emissiveTexture = this.boardTexture; // Makes text glow/visible without lighting
    material.emissiveColor = new Color3(1, 1, 1); // Full brightness
    material.specularColor = new Color3(0, 0, 0); // No specular reflection

    // Draw initial text
    this.updateBoardText("Welcome!", "Ping Pong Arena");
  }
  updateBoardText(line1: string, line2?: string) {
    if (!this.boardTexture) return;

    // Get the texture context
    const ctx = this.boardTexture.getContext();
    const size = this.boardTexture.getSize();

    // Clear previous content
    ctx.clearRect(0, 0, size.width, size.height);

    // Optional: Add background color
    ctx.fillStyle = "white"; // Dark background
    ctx.fillRect(0, 0, size.width, size.height);

    // Set text style
    ctx.fillStyle = "white";
    ctx.font = "bold 80px Arial";
    // ctx.textAlign = "center";
    // ctx.textBaseline = "middle";

    // Draw first line
    ctx.fillText(line1, size.width / 2, size.height / 2 - 60);

    // Draw second line if provided
    if (line2) {
      ctx.font = "60px Arial"; // Smaller font for second line
      ctx.fillText(line2, size.width / 2, size.height / 2 + 60);
    }

    // Update the texture
    this.boardTexture.update();
  }

  async Load() {
    const Container = await LoadAssetContainerAsync(
      "/models/Lobby.glb",
      this.scene
    );
    Container.addAllToScene();

    const ObjGroup = new TransformNode("ArenaGroup", this.scene);

    Container.meshes.forEach((mesh) => {
      if (mesh.name !== "__root__") {
        mesh.parent = ObjGroup;
      }
      if (mesh.name === "Chabka") {
        this.TableBaseMesh = mesh as AbstractMesh;
      }
      if (mesh.name === "Board_RoofMetal_0")
        this.BoardMesh = mesh as AbstractMesh;
      // if (this.meshesToCastShadows.includes(mesh.name)) {
      //   this.Light.addShadowCaster(mesh as AbstractMesh);
      // }
      // if (this.meshesToReceiveShadows.includes(mesh.name)) {
      //   this.Light.setShadowReceiver(mesh as AbstractMesh, true);
      // }
    });
    this.Mesh = ObjGroup;
  }

  // TableBase
  getPhysicsInfo(): {
    position: { x: number; y: number; z: number };
    size: { x: number; y: number; z: number };
  } | null {
    if (!this.TableBaseMesh) return null;

    const pos = this.TableBaseMesh.getAbsolutePosition();
    const boundingInfo = this.TableBaseMesh.getBoundingInfo();
    const size = boundingInfo.boundingBox.extendSize.scale(2); // full size

    return {
      position: {
        x: pos.x,
        y: pos.y,
        z: pos.z,
      },
      size: {
        x: size.x,
        y: size.y,
        z: size.z,
      },
    };
  }
}
