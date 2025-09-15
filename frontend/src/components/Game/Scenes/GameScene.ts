import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";

import { Physics } from "@/components/Game/physics";
import { GameController } from "@/components/Game/controllers/GameController";

// Entities
import { GameCamera } from "@/components/Game/entities/Camera/GameCamera";
import { Debug } from "@/components/Game/entities/Debug.ts";
import { Light } from "@/components/Game/entities/Light";
import { Paddle } from "@/components/Game/entities/Paddle/GamePaddle";
import { Arena } from "@/components/Game/entities/Arena.ts";
import { Ball } from "@/components/Game/entities/Ball.ts";

export class Game {
  // Entities
  localPaddle!: Paddle;
  hostPaddle: Paddle;
  guestPaddle: Paddle;
  ball: Ball;
  arena: Arena;
  camera: GameCamera;
  light: Light;
  debug: Debug;
  canvas: HTMLCanvasElement;
  // Physics
  physics: Physics;
  // Controllers
  controller: GameController;
  // Babylon
  engine: Engine;
  scene: Scene;
  // State flags
  isInitialized: boolean = false;
  isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    if (!canvas) {
      throw new Error("Canvas not found before initializing Game!");
    }
    this.canvas = canvas;

    this.engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
    this.scene = new Scene(this.engine);
  }

  /**
   * Init
   */
  private async initializeGameWorld(playerSide: number) {
    // Physics
    this.physics = new Physics();

    // Camera
    this.camera = new GameCamera(this.scene, playerSide);
    this.camera.attach(this.canvas);

    // Entities
    this.arena = new Arena(this.scene);
    this.hostPaddle = new Paddle(
      this.scene,
      "LEFT",
      true, 
      {
        textureUrl: "/paddle/Survivor.png"
      }
    );
    this.guestPaddle = new Paddle(this.scene, "RIGHT");
    this.ball = new Ball(this.scene);
    this.light = new Light(this.scene);

    // Debugging tools
    this.debug = new Debug(this.scene, this.engine);
    this.debug.ShowAxisLines();
    this.debug.ShowGroundGrid();

    // Load assets in parallel
    await Promise.all([
      this.arena.Load(),
      this.hostPaddle.Load(),
      this.guestPaddle.Load(),
      this.ball.Load(),
    ]);
  }

  /**
   * Start the render/update loop.
   */
  private startRenderLoop() {
    const FIXED_DT = 1 / 60;
    let accumulator = 0;
    let lastTime = performance.now();

    this.engine.runRenderLoop(() => {
      // 9.411266355568738, _y: 6.251347882791112, _z: 0.10065132038983378}
      if (!this.isInitialized) return;

      const now = performance.now();
      accumulator += (now - lastTime) / 1000;
      lastTime = now;

      while (accumulator >= FIXED_DT) {
        // this.controller.fixedUpdate(FIXED_DT);
        accumulator -= FIXED_DT;
      }

      const alpha = accumulator / FIXED_DT;
      // this.controller.updateVisuals(alpha);

      this.scene.render();
    });
  }

  /**
   * Public entry point for starting the game.
   */
  async start(playerSide: number) {
    await this.initializeGameWorld(playerSide);
    this.registerEventListeners();

    this.isInitialized = true;
    this.startRenderLoop();
  }

  /**
   * Attach DOM events like mouse/keyboard input.
   */
  private registerEventListeners() {
    this.canvas.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      if (!this.isInitialized) return;
      // this.controller.triggerServe();
    });
  }
}
