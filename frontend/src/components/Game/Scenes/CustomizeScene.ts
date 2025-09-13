import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import {
  Color3,
  Color4,
  StandardMaterial,
  Texture,
} from "@babylonjs/core";

import { Light } from "../entities/Light";
import { AnimateAutoRotate, AnimateRotation } from "@/utils/gsap";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { CustomizePaddle } from "../entities/Paddle/CustomizePaddle";
import { PaddleCamera } from "../entities/Camera/PaddleCamera";

export class CustomizeScene {
  // Babylon
  engine: Engine;
  scene: Scene;
  canvas: HTMLCanvasElement;

  // Entities
  paddle: CustomizePaddle;
  light: Light;
  camera: PaddleCamera;

  // State
  private textureOverlay: AbstractMesh | null = null;
  private autoRotateController: any;

  constructor(canvas: HTMLCanvasElement) {
    if (!canvas) {
      throw new Error("Canvas not found before initializing CustomizeScene!");
    }

    this.canvas = canvas;
    this.engine = new Engine(canvas, true, {
      adaptToDeviceRatio: true,
      alpha: true,
    });
    this.scene = new Scene(this.engine);

    // entities
    this.light = new Light(this.scene);
    this.paddle = new CustomizePaddle(this.scene);

    // camera
    this.camera = new PaddleCamera(this.scene);
    this.camera.attach(this.canvas);

    // scene defaults
    this.scene.clearColor = new Color4(0, 0, 0, 0);

    // setup interactions + render loop
    this.registerInputHandlers();
    this.startRenderLoop();
  }

  private registerInputHandlers() {
    const mesh = this.paddle.meshGroup;
    if (!mesh) return;

    this.autoRotateController = AnimateAutoRotate(mesh, 0.3);

    let isDragging = false;
    let lastX = 0;
    let targetRotationY = 0;

    const onPointerDown = (event: PointerEvent) => {
      this.autoRotateController.pause();
      isDragging = true;
      lastX = event.clientX;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = event.clientX - lastX;
      lastX = event.clientX;
      targetRotationY -= deltaX * 0.01;
      AnimateRotation(mesh, targetRotationY);
    };

    const onPointerUp = () => {
      if (isDragging) {
        isDragging = false;
        setTimeout(() => this.autoRotateController.resume(), 500);
      }
    };

    this.canvas.addEventListener("pointerdown", onPointerDown);
    this.canvas.addEventListener("pointermove", onPointerMove);
    this.canvas.addEventListener("pointerup", onPointerUp);
    this.canvas.addEventListener("pointerleave", onPointerUp);

    window.addEventListener("resize", () => this.engine.resize());
  }

  private startRenderLoop() {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /**
   * Change paddle base color
   */
  setPaddleColor(color: Color3) {
    const mesh = this.paddle.getMesh();
    if (!mesh) return;

    let mat = mesh.material as StandardMaterial;
    if (!mat || !(mat instanceof StandardMaterial)) {
      mat = new StandardMaterial("paddleBaseMat", this.scene);
      mesh.material = mat;
    }
    mat.diffuseColor = color.clone();
  }

  /**
   * Apply texture overlay effect
   */
  setPaddleTexture(textureUrl?: string) {
    const mesh = this.paddle.getMesh();
    if (!mesh) return;

    // dispose old
    this.textureOverlay?.dispose();
    this.textureOverlay = null;

    if (!textureUrl) return;

    const textureMat = new StandardMaterial("textureMat", this.scene);
    const texture = new Texture(textureUrl, this.scene);

    texture.hasAlpha = true;
    texture.vScale = -1; // flip vertically

    textureMat.diffuseTexture = texture;
    textureMat.useAlphaFromDiffuseTexture = true;

    const cloned = mesh.clone("paddleTextureLayer", null, false);
    if (cloned) {
      cloned.position.z += 0.001;
      cloned.material = textureMat;
      this.textureOverlay = cloned;
    }
  }

  /**
   * Cleanup everything
   */
  dispose() {
    this.scene.dispose();
    this.engine.dispose();
    this.textureOverlay?.dispose();
    this.autoRotateController?.stop();
  }
}
