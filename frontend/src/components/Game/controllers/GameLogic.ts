// GameLogic.ts - Game state and rules module
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Network } from "../network/network";
import { Paddle } from "../entities/Paddle/GamePaddle";
import { Ball } from "../entities/Ball";
import { Physics } from "../physics";
import { NetworkSync } from "./NetworkSync";
import {
  BallHitMessage,
  ballResetMessage,
  ballTossMessage,
} from "@/types/network";
import { BallTrajectory } from "../physics/ballTrajectory";
import { GameState } from "./GameController";

export class GameLogic {
  private net: Network;
  private ball: Ball;
  private physics: Physics;
  private localPaddle: Paddle;
  private opponentPaddle: Paddle;
  private playerId: string;
  private networkSync: NetworkSync;
  private getCurrentTickFn: () => number;

  // Game state
  public gameState: GameState = GameState.WAITING_FOR_SERVE;
  public MyTurnToServe: boolean = false;
  public isLocalServing: boolean = false;
  public TossBallUp: boolean = false;
  public lastCollisionTick: number = 0;

  // Bounce tracking
  private lastTableBounceSide: "LEFT" | "RIGHT" | null = null;
  private lasthitPlayerId: string | null = null;
  private serverSideBounced: boolean = false;
  private isPointEnded: boolean = false;

  // Constants
  private readonly SERVE_VELOCITY_Y: number = 2.5;
  private readonly SPIN_THRESHOLD: number = 28;
  private readonly SPIN_ACTIVATION_THRESHOLD: number = 26;
  private readonly MAX_SPIN: number = 8;

  constructor(
    net: Network,
    ball: Ball,
    physics: Physics,
    localPaddle: Paddle,
    opponentPaddle: Paddle,
    playerId: string,
    networkSync: NetworkSync,
    getCurrentTickFn: () => number,
  ) {
    this.net = net;
    this.ball = ball;
    this.physics = physics;
    this.localPaddle = localPaddle;
    this.opponentPaddle = opponentPaddle;
    this.playerId = playerId;
    this.networkSync = networkSync;
    this.getCurrentTickFn = getCurrentTickFn;

    this.setupPhysicsCallbacks();
    this.setupNetworkListeners();
  }

  // ================= Network Listeners =================
  private setupNetworkListeners(): void {
    // Ball hit messages
    this.net.on("Ball:HitMessage", (data: BallHitMessage) => {
      this.networkSync.applyNetworkBallState(
        data.tick,
        this.getCurrentTick(),
        data.position,
        data.velocity,
        data.applySpin!,
        data.spin!,
      );
    });

    // Ball serve messages
    this.net.on("Ball:Serve", (data: BallHitMessage) => {
      this.physics.setBallFrozen(false);
      this.networkSync.applyNetworkBallState(
        data.tick,
        this.getCurrentTick(),
        data.position,
        data.velocity,
        false,
        data.spin!,
      );
    });

    // Ball toss messages
    this.net.on("Ball:Toss", (data: ballTossMessage) => {
      this.physics.setBallFrozen(false);
      this.TossBallUp = true;
      this.networkSync.applyNetworkBallState(
        data.tick,
        this.getCurrentTick(),
        data.position,
        data.velocity,
        false,
        { x: 0, y: 0, z: 0 },
      );
    });

    // Ball reset (new round)
    this.net.on("Ball:Reset", (data: ballResetMessage) => {
      this.resetRound(data);
    });

    // Serve turn updates
    this.net.on("serve:Turn", (currentServerId: string) => {
      this.MyTurnToServe = currentServerId === this.playerId;
    });

    // Last hit player updates
    this.net.on("lastHitPlayer:updated", (lastHitPlayerId: string) => {
      this.lasthitPlayerId = lastHitPlayerId;
    });

    // Serve state changes
    this.net.on("serveState:changed", (serveState: string) => {
      this.gameState =
        serveState === "in_play"
          ? GameState.IN_PLAY
          : GameState.WAITING_FOR_SERVE;
      this.isLocalServing = false;
    });
  }

  // ================= Physics Callbacks =================
  private setupPhysicsCallbacks(): void {
    this.physics.onBallPaddleCollision = (ball, paddle) => {
      this.handleBallPaddleCollision(ball, paddle);
    };

    this.physics.onBallFloorCollision = (ball) => {
      console.log("Ball hit the floor");
      if (this.shouldSendEvent()) {
        this.ballOut();
      }
    };

    this.physics.onBallNetCollision = (ball) => {
      console.log("Ball hit the net");
      if (this.shouldSendEvent()) {
        this.ballOut();
      }
    };

    this.physics.onBallTableCollision = (ball) => {
      console.log("Ball hit the table");
      if (this.shouldSendEvent()) {
        this.handleTableBounce(ball);
      }
    };
  }

  // ================= Collision Handling =================
  private handleBallPaddleCollision(ball: any, paddle: any): void {
    if (
      this.lasthitPlayerId === this.playerId &&
      this.gameState === GameState.IN_PLAY
    ) {
      return;
    }

    const paddleVelocity = new Vector3(
      paddle.linvel().x,
      paddle.linvel().y,
      paddle.linvel().z,
    );
    const paddleSpeed = paddleVelocity.length();

    this.lastTableBounceSide = null;
    this.lastCollisionTick = this.getCurrentTick();

    let ballVel: Vector3;
    let isServe = false;

    if (this.gameState === GameState.WAITING_FOR_SERVE) {
      // === SERVE HIT ===
      isServe = true;
      ballVel = BallTrajectory.calculateTrajectory(
        ball.translation(),
        paddle.translation(),
        paddleVelocity,
        false,
        paddleSpeed,
        "serve",
      );
      this.physics.setBallSpin(0, 0, 0);
      this.physics.setApplySpin(false);
      this.gameState = GameState.IN_PLAY;
    } else {
      // === RALLY HIT ===
      const spinCalc = this.calculateMagnusSpin(paddleSpeed, paddleVelocity.x);
      this.physics.setBallSpin(0, spinCalc.spinY, 0);
      this.physics.setApplySpin(spinCalc.applySpin);

      ballVel = BallTrajectory.calculateTrajectory(
        ball.translation(),
        paddle.translation(),
        paddleVelocity,
        spinCalc.applySpin,
        paddleSpeed,
        "play",
      );
    }

    // Apply impulse
    const currentVel = ball.linvel();
    const mass = ball.mass();
    const dir = this.localPaddle.side === "LEFT" ? 1 : -1;

    const impulse = new Vector3(
      (ballVel.x - currentVel.x) * mass * dir,
      (ballVel.y - currentVel.y) * mass,
      (ballVel.z - currentVel.z) * mass,
    );

    const paddlePos = paddle.translation();
    const ballPos = ball.translation();

    // TEST:
    const r = {
      x: ballPos.x - paddlePos.x,
      y: ballPos.y - paddlePos.y,
      z: ballPos.z - paddlePos.z,
    };

    // Angular impulse = r × v (cross product)
    const angImpulse = {
      x: r.y * paddleVelocity.z - r.z * paddleVelocity.y,
      y: r.z * paddleVelocity.x - r.x * paddleVelocity.z,
      z: r.x * paddleVelocity.y - r.y * paddleVelocity.x,
    };

    // scale down so it doesn't spin insanely
    angImpulse.x *= 0.4;
    angImpulse.y *= 0.4;
    angImpulse.z *= 0.4;

    this.physics.ball.body.applyImpulse(impulse, true);
    this.physics.ball.body.applyTorqueImpulse(angImpulse, true);

    // Send network message
    const actualVel = ball.linvel();
    const hitMsg: BallHitMessage = {
      position: {
        x: ball.translation().x,
        y: ball.translation().y,
        z: ball.translation().z,
      },
      velocity: { x: actualVel.x, y: actualVel.y, z: actualVel.z },
      spin: {
        x: this.physics.getBallSpin().x,
        y: this.physics.getBallSpin().y,
        z: this.physics.getBallSpin().z,
      },
      applySpin: this.physics.getApplySpin(),
      tick: this.getCurrentTick(),
      playerId: this.playerId,
    };

    this.net.sendMessage(isServe ? "Ball:Serve" : "Ball:HitMessage", hitMsg);
  }

  private handleTableBounce(ball: any): void {
    const ballZ = ball.translation().z;
    const currentSide: "LEFT" | "RIGHT" = ballZ > 0 ? "RIGHT" : "LEFT";
    const lastHitterSide = this.getPlayerSide(this.lasthitPlayerId);
    const serverSide = this.getPlayerSide(
      this.MyTurnToServe ? this.playerId : this.getOpponentId(),
    );

    // --- SERVE PHASE ---
    if (this.gameState === GameState.WAITING_FOR_SERVE) {
      this.ballOut();
      return;
    }

    // --- FIRST BOUNCE AFTER SERVE ---
    if (!this.serverSideBounced) {
      if (currentSide !== serverSide) {
        this.ballOut();
        return;
      }
      this.serverSideBounced = true;
      this.lastTableBounceSide = currentSide;
      return;
    }

    // --- SECOND BOUNCE ---
    if (this.lastTableBounceSide === currentSide) {
      this.ballOut();
      return;
    }

    if (lastHitterSide && currentSide === lastHitterSide) {
      this.ballOut();
      return;
    }

    this.lastTableBounceSide = currentSide;
  }

  // ================= Spin Calculation =================
  private calculateMagnusSpin(
    paddleSpeed: number,
    paddleVelocityX: number,
  ): { spinY: number; applySpin: boolean } {
    let spinY = 0;
    let applySpin = false;

    if (paddleSpeed >= this.SPIN_THRESHOLD) {
      const clampedVelX = Math.max(
        -this.SPIN_THRESHOLD,
        Math.min(this.SPIN_THRESHOLD, paddleVelocityX),
      );

      if (Math.abs(clampedVelX) > this.SPIN_ACTIVATION_THRESHOLD) {
        if (clampedVelX > this.SPIN_ACTIVATION_THRESHOLD) {
          spinY =
            ((clampedVelX - this.SPIN_ACTIVATION_THRESHOLD) /
              (this.SPIN_THRESHOLD - this.SPIN_ACTIVATION_THRESHOLD)) *
            this.MAX_SPIN;
        } else if (clampedVelX < -this.SPIN_ACTIVATION_THRESHOLD) {
          spinY =
            ((clampedVelX + this.SPIN_ACTIVATION_THRESHOLD) /
              (-this.SPIN_THRESHOLD + this.SPIN_ACTIVATION_THRESHOLD)) *
            -this.MAX_SPIN;
        }
        spinY = -spinY;
        applySpin = true;
        this.ball.activateSmokeEffect();
      }
    }

    return { spinY, applySpin };
  }

  // ================= Game State Management =================
  private ballOut(): void {
    if (this.isPointEnded || !this.net.isHost()) return;

    this.isPointEnded = true;
    this.net.sendMessage("Ball:Out", {
      lastTableBounceSide: this.lastTableBounceSide,
      serverSideBounced: this.serverSideBounced,
    });
  }

  public resetRound(data?: ballResetMessage): void {
    this.physics.reset(true, data);
    this.ball.deactivateSmokeEffect();

    this.gameState = GameState.WAITING_FOR_SERVE;
    this.isLocalServing = false;
    this.isPointEnded = false;
    this.TossBallUp = false;

    this.networkSync.reset();
    this.lastCollisionTick = 0;
    this.lastTableBounceSide = null;
    this.serverSideBounced = false;
  }

  public BallServe(ballPos: Vector3, currentTick: number): void {
    this.isLocalServing = true;

    const serveVelocity = new Vector3(0, this.SERVE_VELOCITY_Y, 0);

    this.physics.setBallPosition(ballPos.x, ballPos.y, ballPos.z);
    this.physics.setBallFrozen(false);
    this.physics.setBallVelocity(
      serveVelocity.x,
      serveVelocity.y,
      serveVelocity.z,
    );

    const tossMsg: ballTossMessage = {
      position: { x: ballPos.x, y: ballPos.y, z: ballPos.z },
      velocity: { x: serveVelocity.x, y: serveVelocity.y, z: serveVelocity.z },
      playerId: this.playerId,
      tick: currentTick,
    };
    this.net.sendMessage("Ball:Toss", tossMsg);
  }

  // ================= Helpers =================
  private shouldSendEvent(): boolean {
    return !this.isPointEnded && this.net.isHost();
  }

  private getCurrentTick(): number {
    return this.getCurrentTickFn();
  }

  private getOpponentId(): string | null {
    const playerIds = this.net.getPlayerIds();
    return playerIds.find((id) => id !== this.playerId) || null;
  }

  private getPlayerSide(playerId: string | null): "LEFT" | "RIGHT" | null {
    if (!playerId) return null;
    return playerId === this.playerId
      ? this.localPaddle.side
      : this.opponentPaddle.side;
  }
}
