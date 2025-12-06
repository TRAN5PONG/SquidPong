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
  
  // User
  userId: string;
  userName: string;

  // Players
  hostId: string;
  guestId: string;

  private ballTargetPosition: Vector3 = Vector3.Zero();
  private ballCurrentPosition: Vector3 = Vector3.Zero();
  private ballLerpAlpha: number = 0.15;

  private hostTargetPosition: Vector3 = Vector3.Zero();
  private hostCurrentPosition: Vector3 = Vector3.Zero();
  private guestTargetPosition: Vector3 = Vector3.Zero();
  private guestCurrentPosition: Vector3 = Vector3.Zero();
  private paddleLerpAlpha: number = 0.2;

  constructor(
    canvas: HTMLCanvasElement,
    match: Match,
    userId: string,
    userName: string
  ) {
    this.canvas = canvas;
    this.match = match;
    this.userId = userId;
    this.userName = userName;

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
      this.arena = new Arena(this.scene, this.light, this.net, this.match, true);
      // paddles
      this.hostPaddle = new Paddle(this.scene, "LEFT", true);
      this.guestPaddle = new Paddle(this.scene, "RIGHT", true);
      // ball
      this.ball = new Ball(this.scene);

      // network
      this.net = new Network(
        "wss://10.13.5.5:4433/matches",
        this.match,
        "spectate"
      );
      this.room = await this.net.spectate(this.userId, this.userName);
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
      const targetPos = new Vector3(
        data.position.x,
        data.position.y,
        data.position.z
      );

      if (data.playerId === this.hostId) {
        this.hostTargetPosition = targetPos;
      } else if (data.playerId === this.guestId) {
        this.guestTargetPosition = targetPos;
      }
    });
  }
  private onBallMove() {
    this.room.onMessage("Ball:state", (data: any) => {
      console.log("Ball state data:", data); // Debug log
      this.ballTargetPosition = new Vector3(
        data.position.x,
        data.position.y,
        data.position.z
      );
    });
  }
  /**
   * RENDER LOOP
   */
  public async start() {
    await this.init();

    this.engine.runRenderLoop(() => {
      // Interpolate ball position
      this.ballCurrentPosition = Vector3.Lerp(
        this.ballCurrentPosition,
        this.ballTargetPosition,
        this.ballLerpAlpha
      );
      this.ball.setMeshPosition(this.ballCurrentPosition);

      // Interpolate paddle positions
      this.hostCurrentPosition = Vector3.Lerp(
        this.hostCurrentPosition,
        this.hostTargetPosition,
        this.paddleLerpAlpha
      );
      this.hostPaddle.updatePaddlePosition(
        this.hostCurrentPosition.x,
        this.hostCurrentPosition.y,
        this.hostCurrentPosition.z
      );

      this.guestCurrentPosition = Vector3.Lerp(
        this.guestCurrentPosition,
        this.guestTargetPosition,
        this.paddleLerpAlpha
      );
      this.guestPaddle.updatePaddlePosition(
        this.guestCurrentPosition.x,
        this.guestCurrentPosition.y,
        this.guestCurrentPosition.z
      );

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
