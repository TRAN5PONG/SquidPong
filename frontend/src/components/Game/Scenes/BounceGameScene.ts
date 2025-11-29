import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";

import { Physics } from "@/components/Game/physics";

// Entities
import { Debug } from "@/components/Game/entities/Debug.ts";
import { Light } from "@/components/Game/entities/Light";
import { Ball } from "@/components/Game/entities/Ball.ts";

// Net
import { BounceGameCamera } from "../entities/Camera/BounceGameCamera";
import { BounceGamePaddle } from "../entities/Paddle/BounceGamePaddle";
import { BounceGameLight } from "../entities/BounceGameLight";

// Environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class BounceGameScene {
  // Entities
  mainPaddle!: BounceGamePaddle;
  ball: Ball;
  camera: BounceGameCamera;
  light: BounceGameLight;
  debug: Debug;
  canvas: HTMLCanvasElement;
  // Physics
  physics: Physics;
  // Babylon
  engine: Engine;
  scene: Scene;

  // State flags
  isGameReady: boolean = false;
  isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    if (!canvas) {
      throw new Error("Canvas not found before initializing Game!");
    }
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
    this.scene = new Scene(this.engine);
  }

  /****
   * Init
   */
  private async Init() {
    try {
      // Physics

      // Camera
      this.camera = new BounceGameCamera(this.scene);

      // Entities
      this.ball = new Ball(this.scene);
      this.light = new BounceGameLight(this.scene);

      // Paddles
      this.mainPaddle = new BounceGamePaddle(this.scene);

      // Debugging tools
      // this.debug = new Debug(this.scene, this.engine);
      // this.debug.ShowDebuger();
      // this.debug.ShowAxisLines();
      // this.debug.ShowGroundGrid();

      // Load assets
      await Promise.all([this.ball.Load(), this.mainPaddle.load()]);
    } catch (error) {
      console.error("Error during game initialization:", error);
      throw error;
    }
  }

  /*****DORA Adventures
   * Start the render/update loop.
   */
  private startRenderLoop() {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  /*****
   * Public entry point for starting the game.
   */
  async start() {
    await this.Init();

    this.isGameReady = true;
    this.startRenderLoop();
  }

  /*****
   * Cleanup
   */
  dispose() {
    this.scene.dispose();
    this.engine.dispose();
  }
}
