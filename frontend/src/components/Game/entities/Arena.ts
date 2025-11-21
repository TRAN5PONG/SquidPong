// Arena.ts - Replace the decal system with dynamic impact effects

import { useEffect, useState } from "@/lib/Zeroact";
import {
  Scene,
  TransformNode,
  AbstractMesh,
  LoadAssetContainerAsync,
  StandardMaterial,
  Nullable,
  Observer,
} from "@babylonjs/core";

import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import "@babylonjs/inspector";
import { Light } from "@/components/Game/entities/Light";

import {
  AdvancedDynamicTexture,
  TextBlock,
  Rectangle,
  Control,
} from "@babylonjs/gui";

// Impact effect interface
interface ImpactEffect {
  mesh: AbstractMesh;
  startTime: number;
  duration: number;
}

export class Arena {
  private Mesh: TransformNode | null = null;
  private Light: Light;
  private scene: Scene;
  private TableBaseMesh: AbstractMesh | null = null;
  private BoardMesh: AbstractMesh | null = null;

  private boardGUI: AdvancedDynamicTexture | null = null;
  private boardText1: TextBlock | null = null;
  private gameStatusText: TextBlock | null = null;
  private playersNamesText: TextBlock | null = null;

  // Table Edges Effect
  private TableEdgesMesh: AbstractMesh | null = null;
  private TableEdgesMaterial: StandardMaterial | null = null;
  private pulseObserver: Nullable<Observer<Scene>> = null;

  // Impact Effects System
  private impactEffects: ImpactEffect[] = [];
  private impactObserver: Nullable<Observer<Scene>> = null;

  constructor(scene: Scene, light: Light) {
    this.scene = scene;
    this.Light = light;

    // Start impact animation loop
    this.startImpactAnimationLoop();
  }

  // ---------------------------
  //  GUI BOARD INITIALIZATION
  // ---------------------------
  private initializeBoardGUI() {
    if (!this.BoardMesh) return;

    const uvs = this.BoardMesh.getVerticesData("uv");
    if (uvs) {
      const newUVs = new Float32Array(uvs.length);
      for (let i = 0; i < uvs.length; i += 2) {
        newUVs[i] = uvs[i];
        newUVs[i + 1] = 1 - uvs[i + 1];
      }
      this.BoardMesh.setVerticesData("uv", newUVs);
    }

    this.boardGUI = AdvancedDynamicTexture.CreateForMesh(
      this.BoardMesh,
      2048,
      1024,
      true,
    );

    this.boardGUI.background = "transparent";

    const container = new Rectangle();
    container.width = 1;
    container.height = 1;
    container.thickness = 0;
    container.background = "black";
    this.boardGUI.addControl(container);

    this.boardText1 = this.setupBoardText(
      "line1",
      "Welcome to the Arena!",
      120,
      "rgb(33, 136, 85)",
      "black",
      2,
      "Pixel LCD7",
      undefined,
      -300,
      true,
    );
    this.gameStatusText = this.setupBoardText(
      "line2",
      "--------- Get Ready! ---------",
      80,
      "red",
      "black",
      2,
      "Pixel LCD7",
      undefined,
      -100,
      true,
    );
    this.playersNamesText = this.setupBoardText(
      "line3",
      "HOST VS GUEST",
      130,
      "rgb(33, 136, 85)",
      "#5C5C5C",
      2,
      "Pixel LCD7",
      undefined,
      undefined,
      true,
    );

    container.addControl(this.boardText1);
    container.addControl(this.playersNamesText);
  }

  private setupBoardText(
    headline: string,
    value: string,
    size: number,
    color: string,
    outlineColor: string,
    outlineWidth: number,
    fontFamily: string,
    left?: number,
    top?: number,
    isCentered?: boolean,
  ): TextBlock {
    const text = new TextBlock(headline, value);
    text.fontSize = size;
    text.color = color;
    text.outlineColor = outlineColor;
    text.outlineWidth = outlineWidth;
    text.fontFamily = fontFamily;

    if (isCentered) {
      text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      text.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      text.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      text.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    }

    if (left !== undefined) text.left = left;
    if (top !== undefined) text.top = top;

    return text;
  }

  // ---------------------------
  //  LOAD ARENA MODEL
  // ---------------------------
  async Load() {
    const Container = await LoadAssetContainerAsync(
      "/models/Lobby.glb",
      this.scene,
    );

    Container.addAllToScene();

    const ObjGroup = new TransformNode("ArenaGroup", this.scene);

    Container.meshes.forEach((mesh) => {
      if (mesh.name !== "__root__") {
        mesh.parent = ObjGroup;
      }

      if (mesh.name === "TableBase") {
        console.log("Found TableBase mesh:", mesh);
        this.TableBaseMesh = mesh as AbstractMesh;
      }

      if (mesh.name === "ScreenBoard") {
        this.BoardMesh = mesh as AbstractMesh;
      }

      if (mesh.name === "TableEdges") {
        this.TableEdgesMesh = mesh as AbstractMesh;
        this.TableEdgesMaterial = mesh.material as StandardMaterial;
      }
    });

    this.Mesh = ObjGroup;

    this.initializeBoardGUI();
  }

  // ----------------------------------
  //  PHYSICS HELPER FOR TABLE BASE
  // ----------------------------------
  getPhysicsInfo(): {
    position: { x: number; y: number; z: number };
    size: { x: number; y: number; z: number };
  } | null {
    if (!this.TableBaseMesh) return null;

    const pos = this.TableBaseMesh.getAbsolutePosition();
    const boundingInfo = this.TableBaseMesh.getBoundingInfo();
    const size = boundingInfo.boundingBox.extendSize.scale(2);

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

  updateTableEdgesMaterial(isWon: boolean, intro?: boolean) {
    if (!this.TableEdgesMesh) return;

    const IntroColor = Color3.FromHexString("#fc287b");
    const baseColor = intro
      ? IntroColor
      : isWon
        ? new Color3(0, 1, 0)
        : new Color3(1, 0, 0);
    const mat = new StandardMaterial("pulseMat", this.scene);
    this.TableEdgesMesh.material = mat;

    this.pulseObserver = this.scene.onBeforeRenderObservable.add(() => {
      const t = performance.now() * 0.005;
      const intensity = (Math.sin(t) + 1) / 2;
      mat.emissiveColor = baseColor.scale(intensity);
    });
  }

  stopTableEdgesPulse() {
    if (this.pulseObserver) {
      this.scene.onBeforeRenderObservable.remove(this.pulseObserver);
      this.pulseObserver = null;
    }

    if (this.TableEdgesMaterial && this.TableEdgesMesh) {
      this.TableEdgesMesh.material = this.TableEdgesMaterial;
    }
  }

  // ----------------------------------
  //  IMPACT EFFECT SYSTEM
  // ----------------------------------

  /**
   * Create impact effect at contact point
   */
  createImpact(point: Vector3, normal: Vector3, index: number) {
    if (!this.TableBaseMesh) return;

    // Create expanding ring effect
    const ring = MeshBuilder.CreateTorus(
      "impact_" + Date.now(),
      {
        diameter: 0.01,
        thickness: 0.06,
        tessellation: 8,
      },
      this.scene,
    );

    // Position slightly above table surface to avoid z-fighting
    ring.position = point.add(normal.scale(0.001));

    // Orient ring to face upward (perpendicular to normal)
    ring.lookAt(point.add(normal));

    // Create glowing material
    const mat = new StandardMaterial("impactMat_" + Date.now(), this.scene);
    mat.emissiveColor = new Color3(1, 0.05, 0.5);
    mat.diffuseColor = new Color3(1, 0.05, 0.5);
    mat.alpha = 1.0;
    mat.disableLighting = true;

    ring.material = mat;

    // Add to effects list
    this.impactEffects.push({
      mesh: ring,
      startTime: performance.now(),
      duration: 500, // 500ms animation
    });

    console.log("✅ Impact effect created at", point);
  }

  /**
   * Animation loop for impact effects
   */
  private startImpactAnimationLoop() {
    this.impactObserver = this.scene.onBeforeRenderObservable.add(() => {
      const now = performance.now();

      // Update all active effects
      for (let i = this.impactEffects.length - 1; i >= 0; i--) {
        const effect = this.impactEffects[i];
        const elapsed = now - effect.startTime;
        const progress = Math.min(elapsed / effect.duration, 1.0);

        if (progress >= 1.0) {
          effect.mesh.dispose();
          this.impactEffects.splice(i, 1);
        } else {
          const ring = effect.mesh;
          const mat = ring.material as StandardMaterial;

          // Expand ring
          const scale = 1 + progress * 6;
          ring.scaling.set(scale, scale, 1);

          // Fade out
          const fadeOut = 1 - progress;
          mat.alpha = fadeOut * fadeOut;
          const brightness = fadeOut;
          mat.emissiveColor = new Color3(
            brightness,
            brightness * 0.05,
            brightness * 0.5,
          );
        }
      }
    });
  }

  /**
   * Cleanup
   */
  dispose() {
    // Stop animation loop
    if (this.impactObserver) {
      this.scene.onBeforeRenderObservable.remove(this.impactObserver);
      this.impactObserver = null;
    }

    // Dispose all active effects
    for (const effect of this.impactEffects) {
      effect.mesh.dispose();
    }
    this.impactEffects = [];
  }
}
