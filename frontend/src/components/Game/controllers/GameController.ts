// GameController.ts - Main orchestrator
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene, Plane } from "@babylonjs/core";
import { PointerEventTypes } from "@babylonjs/core";
import { Network } from "../network/network";
import { Paddle } from "../entities/Paddle/GamePaddle";
import { Ball } from "../entities/Ball";
import { Physics } from "../physics";
import { NetworkSync } from "./NetworkSync";
import { GameLogic } from "./GameLogic";
import { DebugMeshManager } from "../DebugMeshManager";
import { Arena } from "../entities/Arena";
import { AIController } from "./ai/AIController";
export enum GameState {
  WAITING_FOR_SERVE,
  IN_PLAY,
}

export class GameController {
  private net: Network | null;
  private localPaddle: Paddle;
  private opponentPaddle: Paddle;
  private ball: Ball;
  private physics: Physics;
  private scene: Scene;
  private playerId: string;
  private arena: Arena;

  // Delegated modules
  private networkSync: NetworkSync;
  private gameLogic: GameLogic;

  // Paddle boundaries
  private paddleZMin: number = 0;
  private paddleZMax: number = 0;

  // Game state
  private hasGameStarted: boolean = false;
  public currentTick: number = 0;

  // Debug
  private debugMeshes: DebugMeshManager;

  private aiController?: AIController;
  private isAIMode: boolean = false;

  constructor(
    localPaddle: Paddle,
    opponentPaddle: Paddle,
    ball: Ball,
    arena: Arena,
    physics: Physics,
    net: Network | null,
    scene: Scene,
    aiMode: boolean = true,
  ) {
    this.localPaddle = localPaddle;
    this.opponentPaddle = opponentPaddle;
    this.ball = ball;
    this.physics = physics;
    this.net = net;
    this.scene = scene;
    this.playerId = net?.getPlayerId() || "local_player";
    this.arena = arena;

    const boundaries = this.localPaddle.getBoundaries();
    this.paddleZMin = boundaries.z.min;
    this.paddleZMax = boundaries.z.max;

    // Debug
    this.debugMeshes = new DebugMeshManager(this.scene);
    // this.debugMeshes.createMeshes();
    // Initialize delegated modules
    if (!aiMode && net) {
      this.networkSync = new NetworkSync(
        net,
        this.ball,
        this.physics,
        this.localPaddle,
        this.opponentPaddle,
        this.playerId,
      );

      this.gameLogic = new GameLogic(
        net,
        this.ball,
        this.physics,
        this.localPaddle,
        this.opponentPaddle,
        this.playerId,
        this.networkSync,
        this.arena,
        () => this.currentTick,
      );
    } else {
      this.networkSync = null!;
      this.gameLogic = null!;
      this.hasGameStarted = true;
    }
    this.isAIMode = aiMode;
    if (aiMode) {
      this.aiController = new AIController(opponentPaddle, 0.7);
    }

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Game started event

    if (this.isAIMode || !this.net) {
      // Mouse click to start rally in AI mode
      this.scene.onPointerObservable.add((pointerInfo: any) => {
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
          const event = pointerInfo.event as PointerEvent;
          if (event.button === 0) {
            // Simple: Just start the ball moving
            this.physics.setBallFrozen(false);
            this.physics.setBallVelocity(0, 2, 5); // Toss ball up
          }
        }
      });
      return; // EXIT - don't setup network listeners
    }

    this.net.on("game:started", () => {
      this.hasGameStarted = true;
      this.networkSync.startSync();
    });

    this.net.on("phase:changed", (newPhase: string) => {
      if (newPhase === "playing") {
        this.hasGameStarted = true;
        this.networkSync.startSync();
      } else {
        this.hasGameStarted = false;
        this.networkSync.stopSync();
        this.gameLogic.resetRound();
      }
    });

    // Mouse click to serve
    this.scene.onPointerObservable.add((pointerInfo: any) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        const event = pointerInfo.event as PointerEvent;
        if (
          event.button === 0 &&
          this.gameLogic.MyTurnToServe &&
          this.gameLogic.gameState === GameState.WAITING_FOR_SERVE
        ) {
          this.gameLogic.BallServe(
            this.ball.getMeshPosition(),
            this.currentTick,
          );
        }
      }
    });

    // Host migration
    // this.net.on("host:migrated", (data) => {
    //   if (this.net.isHost()) {
    //     console.log("📡 I'm now host - taking authority");
    //     console.log("My id is:", this.playerId);
    //     console.log("new host id is:", data.newHostId);
    //   }
    // });
  }

  // ================= 2D To 3D ==================
  private screenToWorld(mouseX: number, mouseY: number): Vector3 {
    const ray = this.scene.createPickingRay(
      mouseX,
      mouseY,
      null,
      this.scene.activeCamera,
    );

    const plane = Plane.FromPositionAndNormal(
      new Vector3(0, 2.8, 0),
      new Vector3(0, 1, 0),
    );
    const distance = ray.intersectsPlane(plane);
    if (distance === null)
      return new Vector3(0, 2.8, this.localPaddle.side === "LEFT" ? -3 : 3);

    return ray.origin.add(ray.direction.scale(distance));
  }

  // ================= Visual Updates =================
  private updateVisualsBall(alpha: number): void {
    if (!this.ball || !this.physics) return;

    if (
      this.gameLogic.gameState === GameState.WAITING_FOR_SERVE &&
      !this.gameLogic.isLocalServing &&
      !this.gameLogic.TossBallUp
    ) {
      this.attachBallToPaddle();
      return;
    }

    const justHadCollision =
      this.gameLogic.lastCollisionTick === this.currentTick;
    if (justHadCollision) {
      const currentPos = this.physics.getBallPosition();
      this.ball.setMeshPosition(currentPos);
    } else {
      const renderPos = Vector3.Lerp(
        this.physics.ball.getPrevPosition(),
        this.physics.ball.getCurrentPosition(),
        alpha,
      );

      const rot = this.physics.ball.body.rotation();

      this.ball.mesh.rotationQuaternion.set(rot.x, rot.y, rot.z, rot.w);

      this.ball.setMeshPosition(renderPos);
    }
  }

  private attachBallToPaddle(): void {
    let paddlePos: Vector3;
    let zOffset: number;

    if (this.gameLogic.MyTurnToServe) {
      paddlePos = this.localPaddle.getMeshPosition();
      zOffset = this.localPaddle.side === "LEFT" ? 1 : -1;
    } else {
      paddlePos = this.opponentPaddle.getMeshPosition();
      zOffset = this.opponentPaddle.side === "LEFT" ? 1 : -1;
    }

    const newBallPos = paddlePos.add(new Vector3(0, 0, zOffset));
    const interpolated = Vector3.Lerp(
      this.ball.getMeshPosition(),
      newBallPos,
      0.4,
    );
    this.ball.setMeshPosition(interpolated);
  }

  // ==================== Public API =================
  public incrementTick(): void {
    this.currentTick++;
  }

  public updateVisuals(alpha: number): void {
    if (!this.hasGameStarted) return;

    const pos = this.physics.paddle.getInterpolatedPos(alpha);
    this.localPaddle.updateVisual(pos as Vector3);

    if (!this.isAIMode && this.networkSync) {
      this.networkSync.updateVisualsOpponentPaddle();
    } else if (this.isAIMode) {
      const aiPos = this.physics.opponentPaddle.getInterpolatedPos(alpha);
      this.opponentPaddle.updateVisual(aiPos as Vector3);
    }
    this.updateVisualsBall(alpha);

    // debug
    // this.debugMeshes.updateBall(this.ball.getMeshPosition());
    // this.debugMeshes.updatePaddle(
    //   this.localPaddle.getMeshPosition(),
    //   this.localPaddle.getMeshRotation(),
    // );
  }

  public pauseGame(): void {
    this.networkSync.stopSync();
  }

  public resumeGame(): void {
    this.networkSync.startSync();
  }

  // public startPlay(): void {
  //   this.gameLogic.gameState = GameState.WAITING_FOR_SERVE;
  // }

  // ==================== AI Update =================
  private updateAIPaddle(target: { x: number; y: number; z: number }): void {
    // Clamp AI paddle to its boundaries
    const boundaries = this.opponentPaddle.getBoundaries();
    const clampedX = Math.max(
      boundaries.x.min,
      Math.min(boundaries.x.max, target.x),
    );
    const clampedZ = Math.max(
      boundaries.z.min,
      Math.min(boundaries.z.max, target.z),
    );

    this.physics.opponentPaddle.setTarget(clampedX, target.y, clampedZ);
  }

  // ==================== Main update =================
  public fixedUpdate(): void {
    if (!this.ball || !this.physics || !this.hasGameStarted) return;

    const pointerX = this.scene.pointerX;
    const pointerY = this.scene.pointerY;
    if (pointerX === undefined || pointerY === undefined) return;

    const worldPos = this.screenToWorld(pointerX, pointerY);
    const clampedZ = Math.max(
      this.paddleZMin,
      Math.min(this.paddleZMax, worldPos.z),
    );

    if (this.isAIMode && this.aiController) {
      const aiTarget = this.aiController.update(
        this.ball,
        this.physics,
        1 / 60,
      );

      this.updateAIPaddle(aiTarget);
    }

    this.physics.paddle.setTarget(worldPos.x, worldPos.y, clampedZ);
    this.physics.ball.setPosition("PREV");
    this.physics.Step();
    this.physics.ball.setPosition("CURR");
    if (!this.isAIMode && this.networkSync) {
      this.networkSync.recordState(this.currentTick);
    }
    this.incrementTick();
  }

  // Expose gameState for external access
  public get gameState(): GameState {
    return this.gameLogic.gameState;
  }

  public get MyTurnToServe(): boolean {
    return this.gameLogic.MyTurnToServe;
  }
}
