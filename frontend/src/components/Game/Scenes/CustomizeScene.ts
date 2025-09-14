import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Color4 } from "@babylonjs/core";

import { Light } from "../entities/Light";
import { AnimateAutoRotate, AnimateRotation } from "@/utils/gsap";
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

    // Start
    this.paddle.ready.then(() => {
      this.registerInputHandlers();
    });
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
   * Cleanup everything
   */
  dispose() {
    this.scene.dispose();
    this.engine.dispose();
    this.autoRotateController?.stop();
  }
}
