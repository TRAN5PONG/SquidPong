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
  // callback for UI to listen to game over event
  public onGameOver?: () => void;
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
      this.physics = new Physics_miniGame();
      await this.physics.init();

      // Camera
      this.camera = new BounceGameCamera(this.scene);

      // Entities
      this.ball = new BounceGameBall(this.scene);
      this.light = new BounceGameLight(this.scene);

      // Paddles
      this.mainPaddle = new BounceGamePaddle(this.scene);

      this.createShadowWall();
      
      this.ball.Load();
      await this.mainPaddle.load();
      
      this.setupShadows();

      // Controller
      this.controller = new MiniGameController(
        this.mainPaddle,
        this.ball,
        this.physics,
        this.scene
      );

      this.controller.onGameOver = () => {
        try {
          this.onGameOver?.();
        } catch (e) {
          console.warn("onGameOver handler threw:", e);
        }
      };

    } catch (error) {
      console.error("Error during game initialization:", error);
      throw error;
    }
  }
  
  private createShadowWall(): void {
    const shadowWall = MeshBuilder.CreatePlane(
      "shadowWall",
      { width: 120, height: 120 },
      this.scene
    );
    
    shadowWall.position.set(-2, 0, 30);
    shadowWall.receiveShadows = true;
    

    const wallMat = new StandardMaterial("shadowWallMat", this.scene);
    wallMat.diffuseColor = Color3.FromHexString("#5081ca");
    wallMat.specularColor = new Color3(0.5, 0.5, 0.5);
    wallMat.backFaceCulling = false;
    
    shadowWall.material = wallMat;
  }

  private setupShadows(): void {
    if (!this.light.spot) {
      console.error("SpotLight not found! Cannot create shadows");
      return;
    }
    
    this.shadowGenerator = new ShadowGenerator(1024, this.light.spot);
    
    if (this.ball.mesh) {
      this.shadowGenerator.addShadowCaster(this.ball.mesh);
      this.ball.mesh.receiveShadows = true;
    } else {
      console.warn("Ball mesh not found!");
    }
    
    if (this.mainPaddle.mesh) {
      const paddleMeshes = this.mainPaddle.mesh.getChildMeshes(false);
      paddleMeshes.forEach((mesh) => {
        if (mesh) {
          this.shadowGenerator.addShadowCaster(mesh, true);
        }
      });
    } else {
      console.warn("Paddle mesh not found!");
    }
  }

  /*
   * Start the render/update loop.
   */
  private startRenderLoop() {
    const FIXED_DT = 1 / 60;
    let accumulator = 0;
    let lastTime = performance.now();

    this.engine.runRenderLoop(() => {
      const now = performance.now();
      const frameTime = (now - lastTime) / 1000;
      lastTime = now;

      accumulator += frameTime;

      while (accumulator >= FIXED_DT) {
        this.controller.FixedUpdate();
        accumulator -= FIXED_DT;
      }

      const alpha = accumulator / FIXED_DT;
      this.controller.UpdateVisuals(alpha);

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
