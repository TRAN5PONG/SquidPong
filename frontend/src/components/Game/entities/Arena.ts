import {
  Scene,
  TransformNode,
  AbstractMesh,
  LoadAssetContainerAsync,
  StandardMaterial,
  Nullable,
  Observer,
  PBRMaterial,
  Texture,
  Mesh,
  VertexData,
} from "@babylonjs/core";

import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import "@babylonjs/inspector";
import { Light } from "@/components/Game/entities/Light";
import { Network } from "@/components/Game/network/network";
import {
  AdvancedDynamicTexture,
  TextBlock,
  Rectangle,
  Control,
  Button,
} from "@babylonjs/gui";
import { Match, MatchPlayer } from "@/types/game/game";

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
  // meshes
  private TableBaseMesh: AbstractMesh | null = null;
  private BoardMesh: AbstractMesh | null = null;
  private floorMesh: AbstractMesh | null = null;
  private net: Network;

  private boardGUI: AdvancedDynamicTexture | null = null;
  private ScoreText: TextBlock | null = null;
  private gameStatusText: TextBlock | null = null;
  private playersNamesText: TextBlock | null = null;

  // Table Edges Effect
  private TableEdgesMesh: AbstractMesh | null = null;
  private TableEdgesMaterial: StandardMaterial | null = null;
  private pulseObserver: Nullable<Observer<Scene>> = null;

  // Impact Effects System
  private impactEffects: ImpactEffect[] = [];
  private impactObserver: Nullable<Observer<Scene>> = null;

  // callbacks
  private onReady?: () => void;
  private onReadyHover?: (isMuffled: boolean) => void;

  // Score
  private match: Match;
  private opponent1Score: number = 0;
  private opponent2Score: number = 0;

  // Spectator
  private isSpectator: boolean = false;

  constructor(
    scene: Scene,
    light: Light,
    net: Network,
    match: Match,
    isSpectator?: boolean
  ) {
    this.scene = scene;
    this.Light = light;
    this.net = net;
    this.match = match;
    this.isSpectator = isSpectator || false;

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
      true
    );

    this.boardGUI.background = "transparent";

    const container = new Rectangle();
    container.width = 1;
    container.height = 1;
    container.thickness = 0;
    container.background = "black";
    this.boardGUI.addControl(container);

    this.gameStatusText = this.setupBoardText(
      "line2",
      // `${this.net.getPhase()}`,
      "",
      70,
      "rgb(33, 136, 85)",
      "black",
      2,
      "Pixel LCD7",
      undefined,
      450,
      true
    );
    this.playersNamesText = this.setupBoardText(
      "line3",
      `${this.match.opponent1.username} VS ${this.match.opponent2.username}`,
      130,
      "rgb(33, 136, 85)",
      "#5C5C5C",
      2,
      "Pixel LCD7",
      undefined,
      -200,
      true
    );
    this.ScoreText = this.setupBoardText(
      "line3",
      `${this.opponent1Score} - ${this.opponent2Score}`,
      200,
      "rgb(33, 136, 85)",
      "black",
      2,
      "Pixel LCD7",
      undefined,
      100,
      true
    );

    container.addControl(this.playersNamesText);
    container.addControl(this.gameStatusText);
    container.addControl(this.ScoreText);
  }
  private initReadyBTN() {
    // Ready BTN
    const plane = MeshBuilder.CreatePlane(
      "buttonPlane",
      { width: 2, height: 1 },
      this.scene
    );

    plane.position = this.TableBaseMesh?.position.clone()!;
    plane.position.y += 4; // 2 units above
    plane.scaling.x *= -1;

    const guiTexture = AdvancedDynamicTexture.CreateForMesh(plane);

    // 3. Create a button
    const button = Button.CreateSimpleButton("readyButton", "READY");
    button.width = 1;
    button.height = 0.4;
    button.fontSize = 200;
    button.color = "white";
    button.background = "#ca2f3ce6";
    button.fontFamily = "Game Of Squids";
    button.onPointerUpObservable.add(() => {
      if (this.onReady) this.onReady();
      this.Light.setDirecionLightIntensity(0.8);
      this.Light.setAambientLightIntensity(0.2);
      guiTexture.dispose();
      plane.dispose();
    });
    button.onPointerEnterObservable.add(() => {
      if (this.onReadyHover) this.onReadyHover(true);
      this.Light.setDirecionLightIntensity(0);
      this.Light.setAambientLightIntensity(0.05);
    });
    button.onPointerOutObservable.add(() => {
      if (this.onReadyHover) this.onReadyHover(false);
      this.Light.setDirecionLightIntensity(0.8);
      this.Light.setAambientLightIntensity(0.2);
    });

    // 4. Add button to the plane
    guiTexture.addControl(button);
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
  
  Container.meshes.forEach((mesh: any) => {
    if (mesh.name === "__root__") return;

    // Ensure materials are properly set up for lighting
    const material = mesh.material as PBRMaterial;
    // if (material) {
    //   material.unlit = false;
    //   material.backFaceCulling = true;
    // }

    mesh.parent = ObjGroup;

    // Add ALL meshes as shadow casters first
    this.Light.addShadowCaster(mesh);

    mesh.receiveShadows = true;

    if (mesh.name === "TableBase") {
      this.TableBaseMesh = mesh as AbstractMesh;
      mesh.receiveShadows = true; // Explicitly enable
    }

    if (mesh.name === "Floor_Floor_0") {
      this.floorMesh = mesh as AbstractMesh;
      mesh.receiveShadows = true; // Explicitly enable
    }

    if (mesh.name === "ScreenBoard") {
      this.BoardMesh = mesh as AbstractMesh;
    }

    if (mesh.name === "TableEdges") {
      this.TableEdgesMesh = mesh as AbstractMesh;
      this.TableEdgesMaterial = mesh.material as StandardMaterial;
      mesh.receiveShadows = true;
    }
  });

  this.Mesh = ObjGroup;
  this.initializeBoardGUI();

  if (!this.isSpectator) {
    this.initReadyBTN();
  }

  // IMPORTANT: Force a render to ensure shadows are calculated
  this.scene.render();
}

// Additional debugging helper - add this method to check shadow setup:
debugShadows() {
  console.log("Shadow Generator:", this.Light.getShadowGenerator());
  console.log("Shadow Map Size:", this.Light.getShadowGenerator()?.getShadowMap()?.getSize());
  console.log("Shadow Casters:", this.Light.getShadowGenerator()?.getShadowMap()?.renderList?.length);
  
  // Check which meshes receive shadows
  this.scene.meshes.forEach(mesh => {
    if (mesh.receiveShadows) {
      console.log(`${mesh.name} receives shadows`);
    }
  });
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

  setOnReadyHover(func: (isMuffled: boolean) => void) {
    this.onReadyHover = func;
  }
  setOnReadyClick(func: () => void) {
    this.onReady = func;
  }
  setOpponent1Score(val: number) {
    this.opponent1Score = val;
    if (this.ScoreText) {
      this.ScoreText.text = `${this.opponent1Score} - ${this.opponent2Score}`;
    }
  }
  setOpponent2Score(val: number) {
    this.opponent2Score = val;
    if (this.ScoreText) {
      this.ScoreText.text = `${this.opponent1Score} - ${this.opponent2Score}`;
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
      this.scene
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
            brightness * 0.5
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
