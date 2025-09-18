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
import { Match } from "@/types/game";

// Net
import { Network } from "@/components/Game/network/network";
import { MatchState } from "../network/GameState";
import { Room } from "colyseus.js";

export class Game {
  // Game data
  match!: Match;
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
      ? match.opponent1.id
      : match?.opponent2.id;
    this.guestId = match?.opponent1.isHost
      ? match.opponent2.id
      : match?.opponent1.id;
    this.userPlayerId =
      match?.opponent1.userId === userId
        ? match?.opponent1.id
        : match?.opponent2.id;

    this.engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
    this.scene = new Scene(this.engine);
  }

  /**
   * Init
   */
  private async Init() {
    try {
      // Physics
      this.physics = new Physics();

      // Camera
      this.camera = new GameCamera(
        this.scene,
        this.userId === this.hostId ? 1 : -1
      );
      this.camera.attach(this.canvas);

      // Network
      this.net = new Network("ws://10.13.2.6:3000", this.match);
      this.room = await this.net.join(this.userId);

      // Entities
      this.arena = new Arena(this.scene);
      this.hostPaddle = new Paddle(this.scene, "LEFT", true, {
        textureUrl: "/paddle/Survivor.png",
      });
      this.guestPaddle = new Paddle(this.scene, "RIGHT");
      this.ball = new Ball(this.scene);
      this.light = new Light(this.scene);

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

  /**
   * Start the render/update loop.
   */
  private startRenderLoop() {
    this.engine.runRenderLoop(() => {
      if (!this.isGameReady) return;
      this.scene.render();
    });
  }

  /**
   * Public entry point for starting the game.
   */
  async start() {
    await this.Init();

    this.isGameReady = true;
    this.startRenderLoop();
  }

  dispose() {
    this.scene.dispose();
    this.engine.dispose();
  }
}
