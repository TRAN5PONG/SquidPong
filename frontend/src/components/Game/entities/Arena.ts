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
  StackPanel,
  Button,
  Control,
} from "@babylonjs/gui";

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

  constructor(scene: Scene, light: Light) {
    this.scene = scene;
    this.Light = light;
  }

  // ---------------------------
  //  GUI BOARD INITIALIZATION
  // ---------------------------
  private initializeBoardGUI() {
    if (!this.BoardMesh) return;

    // 🔥 Fix the upside-down text by inverting V coordinates
    const uvs = this.BoardMesh.getVerticesData("uv");
    if (uvs) {
      const newUVs = new Float32Array(uvs.length);
      for (let i = 0; i < uvs.length; i += 2) {
        newUVs[i] = uvs[i]; // Keep U the same
        newUVs[i + 1] = 1 - uvs[i + 1]; // 🔥 Flip V coordinate
      }
      this.BoardMesh.setVerticesData("uv", newUVs);
    }

    this.boardGUI = AdvancedDynamicTexture.CreateForMesh(
      this.BoardMesh,
      2048,
      1024,
      true
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
      true
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
      true
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
      true
    );

    container.addControl(this.boardText1);
    // container.addControl(this.gameStatusText);
    container.addControl(this.playersNamesText);

    // 🔥 SET THESE ALIGNMENT PROPERTIES!
    // this.boardText1.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    // this.boardText1.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    // this.boardText1.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    // this.boardText1.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    // Now the offset will work
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
    isCentered?: boolean
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

      if (mesh.name === "ScreenBoard") {
        this.BoardMesh = mesh as AbstractMesh;
      }

      if (mesh.name === "TableEdges") {
        this.TableEdgesMesh = mesh as AbstractMesh;
        this.TableEdgesMaterial = mesh.material as StandardMaterial;
      }
    });

    this.Mesh = ObjGroup;

    // initialize GUI on board
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
      const intensity = (Math.sin(t) + 1) / 2; // [0..1]
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
}
