import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

import { Physics_miniGame } from "@/components/Game/physics/Bounce";

// Entities
import { Debug } from "@/components/Game/entities/Debug.ts";
import { BounceGameBall } from "@/components/Game/entities/Ball/BounceGameBall.ts";

import { BounceGameCamera } from "../entities/Camera/BounceGameCamera";
import { BounceGamePaddle } from "../entities/Paddle/BounceGamePaddle";
import { BounceGameLight } from "../entities/BounceGameLight";
import { MiniGameController } from "../controllers/miniGameController";

export class BounceGameScene {
  // Entities
  mainPaddle!: BounceGamePaddle;
  ball: BounceGameBall;
  camera: BounceGameCamera;
  light: BounceGameLight;
  debug: Debug;
  canvas: HTMLCanvasElement;
  shadowGenerator!: ShadowGenerator;
  
  // Physics
  physics: Physics_miniGame;
  // Controller
  controller: MiniGameController;
  // Babylon
  engine: Engine;
  scene: Scene;

  // State flags
  isGameReady: boolean = false;
  isRunning: boolean = false;
  
  // UI callbacks
  public onGameOver?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    if (!canvas) {
      throw new Error("Canvas not found before initializing Game!");
    }
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
    this.scene = new Scene(this.engine);
    
    // Create default environment like original Bounce-pong-3D
    (this.scene as any).createDefaultEnvironment({
      createGround: false,
      createSkybox: false,
    });
  }

  /****
   * Init
   */
  private async Init() {
    try {
      // Physics
      this.physics = new Physics_miniGame();
      await this.physics.init();

      // Camera
      this.camera = new BounceGameCamera(this.scene);

      // Entities
      this.ball = new BounceGameBall(this.scene);
      this.light = new BounceGameLight(this.scene);

      // Paddles
      this.mainPaddle = new BounceGamePaddle(this.scene);

      // Load assets (ball is created immediately, only paddle needs loading)
      this.ball.Load();
      await this.mainPaddle.load();
      
      // Create back wall for shadows
      this.createShadowWall();
      
      // Setup shadows
      this.setupShadows();

      // Controller
      this.controller = new MiniGameController(
        this.mainPaddle,
        this.ball,
        this.physics,
        this.scene
      );

      // Setup collision callbacks
      this.physics.onBallPaddleCollision = () => {
        // Increment score when ball hits paddle
        this.controller.incrementScore();
        console.log(`Ball hit paddle! Score: ${this.controller.score}`);
      };

      this.physics.onBallFloorCollision = () => {
        // Ball dropped - game over will be handled by controller
        console.log("Ball hit floor - Game Over!");
      };

      // Debugging tools
      // this.debug = new Debug(this.scene, this.engine);
      // this.debug.ShowDebuger();
      // this.debug.ShowAxisLines();
      // this.debug.ShowGroundGrid();
    } catch (error) {
      console.error("Error during game initialization:", error);
      throw error;
    }
  }

  /**
   * Create vertical back wall to receive shadows (like in original)
   */
  private createShadowWall(): void {
    // Create a large vertical plane as back wall
    const shadowWall = MeshBuilder.CreatePlane(
      "shadowWall",
      { width: 40, height: 40 },
      this.scene
    );
    
    // Position it far behind the game area
    shadowWall.position.set(0, 0, -8);
    shadowWall.rotation.x = 0; // Keep it vertical
    shadowWall.receiveShadows = true;
    
    // Semi-transparent dark material for subtle shadows
    const wallMat = new StandardMaterial("shadowWallMat", this.scene);
    wallMat.diffuseColor = new Color3(0.08, 0.12, 0.18); // Dark bluish
    // Make the wall fully opaque so shadows are clearly visible (like reference)
    wallMat.alpha = 1.0;
    wallMat.backFaceCulling = false;
    shadowWall.material = wallMat;
  }

  /**
   * Setup shadow rendering for better visuals
   */
  private setupShadows(): void {
    if (!this.light.spot) return;

    // Create shadow generator using spot light
    this.shadowGenerator = new ShadowGenerator(2048, this.light.spot);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurScale = 2;
    this.shadowGenerator.blurBoxOffset = 1;
    this.shadowGenerator.setDarkness(0.5);
  // Use non-transparent shadowing for predictable results
  this.shadowGenerator.transparencyShadow = false;

    // Add shadow casters
    if (this.ball.mesh) {
      this.shadowGenerator.addShadowCaster(this.ball.mesh);
      this.ball.mesh.receiveShadows = true;
    }
    
    if (this.mainPaddle.mesh) {
      this.shadowGenerator.addShadowCaster(this.mainPaddle.mesh);
      this.mainPaddle.mesh.receiveShadows = true;
    }

    console.log("Shadows enabled with floor");
  }

  /*
   * Start the render/update loop.
   */
  private startRenderLoop() {
    const FIXED_DT = 1 / 60; // Physics timestep: 60Hz
    let accumulator = 0;
    let lastTime = performance.now();

    this.engine.runRenderLoop(() => {
      const now = performance.now();
      const frameTime = (now - lastTime) / 1000; // convert ms → seconds
      lastTime = now;

      accumulator += frameTime;

      // --- Fixed-step physics loop ---
      while (accumulator >= FIXED_DT) {
        this.controller.FixedUpdate();
        accumulator -= FIXED_DT;
      }

      // --- Compute interpolation factor for visuals ---
      const alpha = accumulator / FIXED_DT;
      this.controller.UpdateVisuals(alpha);

      // Check for game over and trigger callback
      if (this.controller.isGameOver && this.onGameOver) {
        this.onGameOver();
        this.onGameOver = undefined; // Call only once
      }

      this.scene.render();
    });
  }

  /*****
   * Public entry point for starting the game.
   */
  async start() {
    await this.Init();

    this.isGameReady = true;
    this.isRunning = true;
    this.startRenderLoop();
    
    // Start the mini game after a short delay
    setTimeout(() => {
      this.controller.startGame();
    }, 1000);
  }

  /*****
   * Restart the game
   */
  public restart() {
    if (this.controller) {
      this.controller.reset();
      this.controller.startGame();
    }
  }

  /*****
   * Get current score
   */
  public getScore(): number {
    return this.controller?.score || 0;
  }

  /*****
   * Check if game is over
   */
  public isOver(): boolean {
    return this.controller?.isGameOver || false;
  }

  /*****
   * Cleanup
   */
  dispose() {
    this.isRunning = false;
    this.scene.dispose();
    this.engine.dispose();
  }
}
