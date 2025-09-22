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
import { Match } from "@/types/game/game";

// Net
import { Network } from "@/components/Game/network/network";
import { MatchState } from "../network/GameState";
import { Room } from "colyseus.js";
import { paddleColors, paddleTextures } from "@/types/game/paddle";

export class Game {
  // Game data
  match!: Match;
  // Entities
  localPaddle!: Paddle;
  opponentPaddle!: Paddle;
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
  // Network
  net: Network;
  room: Room<MatchState>;
  // Babylon
  engine: Engine;
  scene: Scene;

  // State flags
  isGameReady: boolean = false;
  isRunning: boolean = false;

  // Players
  hostId: string;
  guestId: string;
  userId: string;
  userPlayerId: string;

  constructor(canvas: HTMLCanvasElement, match: Match, userId: string) {
    if (!canvas) {
      throw new Error("Canvas not found before initializing Game!");
    }
    this.canvas = canvas;
    this.match = match;

    this.userId = userId;
    this.hostId = match?.opponent1.isHost
      ? match.opponent1.userId
      : match?.opponent2.userId;
    this.guestId = match?.opponent1.isHost
      ? match.opponent2.userId
      : match?.opponent1.userId;
    this.userPlayerId =
      match?.opponent1.userId === userId
        ? match?.opponent1.id
        : match?.opponent2.id;

    this.engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
    this.scene = new Scene(this.engine);
  }

  /****
   * Init
   */
  private async Init() {
    try {
      // Physics
      this.physics = new Physics();
      this.physics.init();

      // Camera
      this.camera = new GameCamera(
        this.scene,
        this.userId === this.hostId ? 1 : -1
      );
      this.camera.attach(this.canvas);

      // Network
      this.net = new Network("ws://10.13.5.1:3000", this.match);
      this.room = await this.net.join(this.userId);

      // Entities
      this.arena = new Arena(this.scene);
      this.ball = new Ball(this.scene);
      this.light = new Light(this.scene);

      // Paddles setup
      this.hostPaddle = new Paddle(
        this.scene,
        "RIGHT",
        this.userId === this.hostId,
        this.userId === this.hostId ? this.physics.paddle : null,
        {
          color: paddleColors[0],
          texture: paddleTextures[1],
        }
      );
      this.guestPaddle = new Paddle(
        this.scene,
        "LEFT",
        this.userId === this.guestId,
        this.userId === this.hostId ? this.physics.paddle : null,
        {
          color: paddleColors[1],
        }
      );

      this.localPaddle =
        this.userId === this.hostId ? this.hostPaddle : this.guestPaddle;
      this.opponentPaddle =
        this.userId === this.hostId ? this.guestPaddle : this.hostPaddle;

      // Controller
      this.controller = new GameController(
        this.localPaddle,
        this.opponentPaddle,
        this.ball,
        this.physics,
        this.net,
        this.scene
      );

      // Debugging tools
      this.debug = new Debug(this.scene, this.engine);
      this.debug.ShowAxisLines();
      this.debug.ShowGroundGrid();

      // Load assets
      await Promise.all([
        this.arena.Load(),
        this.hostPaddle.Load(),
        this.guestPaddle.Load(),
        this.ball.Load(),
      ]);
    } catch (error) {
      console.error("Error during game initialization:", error);
      throw error;
    }
  }

  /*****
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
        this.controller.fixedUpdate();
        accumulator -= FIXED_DT;
      }
      // --- Compute interpolation factor for visuals ---
      const alpha = accumulator / FIXED_DT;
      // Update visuals using interpolation
      this.controller.updateVisuals(alpha);

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
   * Getters
   */
  getUserPlayerId() {
    return this.userPlayerId;
  }

  /*****
   * Cleanup
   */
  dispose() {
    this.scene.dispose();
    this.engine.dispose();
  }
}
