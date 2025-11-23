import { Match } from "@/types/game/game";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Room } from "colyseus.js";
import { Scene } from "@babylonjs/core/scene";
import { BasePaddle } from "../entities/Paddle/Paddle";
import { Ball } from "../entities/Ball";
import { Arena } from "../entities/Arena";
import { SpectatorCamera } from "../entities/Camera/SpectatorCamera";
import { Light } from "../entities/Light";
import { Network } from "../network/network";
import { MatchState } from "../network/GameState";
import { Paddle } from "../entities/Paddle/GamePaddle";
import { Vec3 } from "@/types/network";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Debug } from "../entities/Debug";

export class SpectateScene {
  match!: Match;
  canvas: HTMLCanvasElement;
  engine: Engine;
  scene: Scene;
  // Entities
  debug: Debug;
  hostPaddle: Paddle;
  guestPaddle: Paddle;
  ball: Ball;
  arena: Arena;
  camera: SpectatorCamera;
  light: Light;
  // Network
  net: Network;
  room: Room<MatchState>;

  // Players
  userId: string;
  hostId: string;
  guestId: string;

  constructor(canvas: HTMLCanvasElement, match: Match, userId: string) {
    this.canvas = canvas;
    this.match = match;
    this.userId = userId;

    this.hostId = match?.opponent1.isHost
      ? match.opponent1.id
      : match?.opponent2.id;
    this.guestId = match?.opponent1.isHost
      ? match.opponent2.id
      : match?.opponent1.id;

    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);
  }

  /**
   * INIT SCENE
   */
  private async init() {
    try {
      // camera
      this.camera = new SpectatorCamera(this.scene);
      this.camera.attach(this.canvas);
      // light
      this.light = new Light(this.scene);
      // arena
      this.arena = new Arena(this.scene, this.light);
      // paddles
      this.hostPaddle = new Paddle(this.scene, "LEFT", true);
      this.guestPaddle = new Paddle(this.scene, "RIGHT", true);
      // ball
      this.ball = new Ball(this.scene);

      // network
      this.net = new Network(
        "wss://10.13.249.173:4433/matches",
        this.match,
        "spectate",
      );
      this.room = await this.net.spectate(this.userId);
      this.onPaddleMove();
      this.onBallMove();

      // Debugging tools
      // this.debug = new Debug(this.scene, this.engine);
      // this.debug.ShowDebuger();

      // load
      await Promise.all([
        this.arena.Load(),
        this.hostPaddle.load(),
        this.guestPaddle.load(),
        this.ball.Load(),
      ]);
    } catch (err) {
      console.error("Error initializing SpectateScene:", err);
    }
  }

  /**
   * EVENTS
   */
  private onPaddleMove() {
    this.room.onMessage("opponent:paddle", (data: any) => {
      if (data.playerId === this.hostId) {
        // host paddle
        this.hostPaddle.updatePaddlePosition(
          data.position.x,
          data.position.y,
          data.position.z,
        );
      } else if (data.playerId === this.guestId) {
        // guest paddle
        this.guestPaddle.updatePaddlePosition(
          data.position.x,
          data.position.y,
          data.position.z,
        );
      }
    });
  }

  private onBallMove() {
    this.room.onMessage("Ball:state", (data: any) => {
      const newPos = new Vector3(
        data.position.x,
        data.position.y,
        data.position.z,
      );
      this.ball.setMeshPosition(newPos);
    });
  }

  /**
   * RENDER LOOP
   */
  public async start() {
    await this.init();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }

  /**
   * Getters
   */
  public getCamera(): SpectatorCamera {
    return this.camera;
  }

  dispose() {
    this.engine.dispose();
  }
}
