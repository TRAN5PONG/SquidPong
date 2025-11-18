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
import { constants } from "../../../utils/constants";

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
  private readonly BALL_RADIUS: number = constants.BALL.radius;

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
        data.angVelocity,
        data.spin!,
      );
    });

    // Ball serve messages
    this.net.on("Ball:Serve", (data: BallHitMessage) => {
      this.gameState = GameState.IN_PLAY;
      this.physics.setBallFrozen(false);
      this.networkSync.applyNetworkBallState(
        data.tick,
        this.getCurrentTick(),
        data.position,
        data.velocity,
        data.angVelocity,
        data.spin!,
      );
    });

    // Ball toss messages
    this.net.on("Ball:Toss", (data: ballTossMessage) => {
      this.TossBallUp = true;
      this.physics.setBallFrozen(false);
      this.networkSync.applyNetworkBallState(
        data.tick,
        this.getCurrentTick(),
        data.position,
        data.velocity,
        { x: 0, y: 0, z: 0 },
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
      const newState =
        serveState === "in_play"
          ? GameState.IN_PLAY
          : GameState.WAITING_FOR_SERVE;

      // // Only update if we're not actively serving
      // if (!this.isLocalServing || newState === GameState.IN_PLAY) {
      //   this.gameState = newState;
      // }
      //
      // // Only reset isLocalServing when ball goes into play
      // if (newState === GameState.IN_PLAY) {
      //   this.isLocalServing = false;
      // }
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
  // private handleBallPaddleCollision(ball: any, paddle: any): void {
  //   if (
  //     this.lasthitPlayerId === this.playerId &&
  //     this.gameState === GameState.IN_PLAY
  //   ) {
  //     return;
  //   }
  //
  //   // TODO: Improve this for good performance
  //   const paddleVelocity = new Vector3(
  //     paddle.linvel().x,
  //     paddle.linvel().y,
  //     paddle.linvel().z,
  //   );
  //   const paddleSpeed = paddleVelocity.length();
  //
  //   this.lastTableBounceSide = null;
  //   this.lastCollisionTick = this.getCurrentTick();
  //
  //   let ballVel: Vector3;
  //   let isServe = false;
  //
  //   if (this.gameState === GameState.WAITING_FOR_SERVE) {
  //     // === SERVE HIT ===
  //     isServe = true;
  //     ballVel = BallTrajectory.calculateTrajectory(
  //       ball.translation(),
  //       paddle.translation(),
  //       paddleVelocity,
  //       false,
  //       paddleSpeed,
  //       "serve",
  //     );
  //     this.physics.setBallSpin(0, 0, 0);
  //     this.physics.setApplySpin(false);
  //     this.gameState = GameState.IN_PLAY;
  //   } else {
  //     // === RALLY HIT ===
  //     const spinCalc = this.calculateMagnusSpin(paddleSpeed, paddleVelocity.x);
  //     this.physics.setBallSpin(0, spinCalc.spinY, 0);
  //     this.physics.setApplySpin(spinCalc.applySpin);
  //
  //     ballVel = BallTrajectory.calculateTrajectory(
  //       ball.translation(),
  //       paddle.translation(),
  //       paddleVelocity,
  //       spinCalc.applySpin,
  //       paddleSpeed,
  //       "play",
  //     );
  //   }
  //
  //   // Apply impulse
  //   const currentVel = ball.linvel();
  //   const mass = ball.mass();
  //   const dir = this.localPaddle.side === "LEFT" ? 1 : -1;
  //
  //   const impulse = new Vector3(
  //     (ballVel.x - currentVel.x) * mass * dir,
  //     (ballVel.y - currentVel.y) * mass,
  //     (ballVel.z - currentVel.z) * mass,
  //   );
  //
  //   const paddlePos = paddle.translation();
  //   const ballPos = ball.translation();
  //
  //   // TEST:
  //   // radius vector from paddle to ball Hit the center → no spin
  //   // | Hit the top → topspin | Hit the bottom → backspin | Hit the sides → sidespin
  //   const r = {
  //     x: ballPos.x - paddlePos.x,
  //     y: ballPos.y - paddlePos.y,
  //     z: ballPos.z - paddlePos.z,
  //   };
  //
  //   // Normalize r so spin depends only on the hit position
  //   let rLength = Math.sqrt(r.x * r.x + r.y * r.y + r.z * r.z);
  //   if (rLength === 0) {
  //     r.x = 0;
  //     r.y = 1;
  //     r.z = 0;
  //     rLength = 1;
  //   } else {
  //     r.x /= rLength;
  //     r.y /= rLength;
  //     r.z /= rLength;
  //   }
  //
  //   // Cross product r × v (rotation direction)
  //   const ang = {
  //     x: r.y * paddleVelocity.z - r.z * paddleVelocity.y,
  //     y: r.z * paddleVelocity.x - r.x * paddleVelocity.z,
  //     z: r.x * paddleVelocity.y - r.y * paddleVelocity.x,
  //   };
  //
  //   const SPIN_SCALE = this.BALL_RADIUS * 0.9;
  //   ang.x *= SPIN_SCALE;
  //   ang.y *= SPIN_SCALE;
  //   ang.z *= SPIN_SCALE;
  //
  //   this.physics.ball.body.applyImpulse(impulse, true);
  //   this.physics.ball.body.applyTorqueImpulse(ang, true);
  //
  //   // Send network message
  //   const actualVel = ball.linvel();
  //   const hitMsg: BallHitMessage = {
  //     position: {
  //       x: ball.translation().x,
  //       y: ball.translation().y,
  //       z: ball.translation().z,
  //     },
  //     velocity: { x: actualVel.x, y: actualVel.y, z: actualVel.z },
  //     spin: {
  //       x: this.physics.getBallSpin().x,
  //       y: this.physics.getBallSpin().y,
  //       z: this.physics.getBallSpin().z,
  //     },
  //     applySpin: this.physics.getApplySpin(),
  //     tick: this.getCurrentTick(),
  //     playerId: this.playerId,
  //   };
  //
  //   this.net.sendMessage(isServe ? "Ball:Serve" : "Ball:HitMessage", hitMsg);
  // }
  //
  // OPTIMIZED VERSION - Reduces allocations and repeated calculations

  private handleBallPaddleCollision(ball: any, paddle: any): void {
    // --- ignore double hits ---
    if (
      this.lasthitPlayerId === this.playerId &&
      this.gameState === GameState.IN_PLAY
    )
      return;

    console.log("Ball-Paddle collision detected");

    this.lastTableBounceSide = null;
    this.lastCollisionTick = this.getCurrentTick();

    // --- Get positions (read once) ---
    const paddlePos = paddle.translation();
    const ballPos = ball.translation();

    // --- Get velocities (read once) ---
    const paddleVel = paddle.linvel();
    const ballCurrentVel = ball.linvel();

    // --- Calculate paddle speed (inline, no sqrt until needed) ---
    const paddleSpeedSq =
      paddleVel.x ** 2 + paddleVel.y ** 2 + paddleVel.z ** 2;
    const paddleSpeed = Math.sqrt(paddleSpeedSq);

    let ballVel: Vector3;
    let isServe = false;

    if (this.gameState === GameState.WAITING_FOR_SERVE) {
      // === Serve hit ===
      isServe = true;
      ballVel = BallTrajectory.calculateTrajectory(
        ballPos,
        paddlePos,
        paddleVel,
        false,
        paddleSpeed,
        "serve",
      );
      this.physics.setBallSpin(0, 0, 0);
      this.physics.setApplySpin(false);
      this.gameState = GameState.IN_PLAY;

      console.log("Serve hit detected, ballVel:", ballVel);
    } else {
      // === Rally hit ===
      const spinCalc = this.calculateMagnusSpin(paddleSpeed, paddleVel.x);
      this.physics.setBallSpin(0, spinCalc.spinY, 0);
      // applySpin = spinCalc.applySpin;
      // this.physics.setApplySpin(applySpin);
      ballVel = BallTrajectory.calculateTrajectory(
        ballPos,
        paddlePos,
        paddleVel,
        spinCalc.applySpin,
        paddleSpeed,
        "play",
      );
    }

    // --- Linear impulse (inline calculation) ---
    const mass = ball.mass();
    const dir = this.localPaddle.side === "LEFT" ? 1 : -1;

    const impulse = {
      x: (ballVel.x - ballCurrentVel.x) * mass * dir,
      y: (ballVel.y - ballCurrentVel.y) * mass,
      z: (ballVel.z - ballCurrentVel.z) * mass,
    };

    // --- Radius vector (inline, avoid extra allocations) ---
    let rx = ballPos.x - paddlePos.x;
    let ry = ballPos.y - paddlePos.y;
    let rz = ballPos.z - paddlePos.z;

    // --- Normalize radius vector ---
    let rLenSq = rx * rx + ry * ry + rz * rz;

    if (rLenSq < 1e-6) {
      // Hit dead center - use default up vector
      rx = 0;
      ry = 1;
      rz = 0;
    } else {
      // Normalize
      const rLen = Math.sqrt(rLenSq);
      const invRLen = 1 / rLen; // Division is slower than multiplication
      rx *= invRLen;
      ry *= invRLen;
      rz *= invRLen;
    }

    // --- Angular impulse: r × paddleVel (cross product) ---
    const SPIN_SCALE = this.BALL_RADIUS * 0.9;

    let angX = (ry * paddleVel.z - rz * paddleVel.y) * SPIN_SCALE;
    let angY =
      (rz * paddleVel.x - rx * paddleVel.z) * SPIN_SCALE - paddleVel.x * 0.5;
    let angZ = (rx * paddleVel.y - ry * paddleVel.x) * SPIN_SCALE;

    // --- Clamp max torque (inline) ---
    const maxTorque = 1.5;
    const angMagSq = angX * angX + angY * angY + angZ * angZ;

    if (angMagSq > maxTorque * maxTorque) {
      const scale = maxTorque / Math.sqrt(angMagSq);
      angX *= scale;
      angY *= scale;
      angZ *= scale;
    }

    // --- Apply impulses ---
    this.physics.ball.body.applyImpulse(impulse, true);
    this.physics.ball.body.applyTorqueImpulse(
      { x: angX, y: angY, z: angZ },
      true,
    );

    // --- Send network update ---
    const hitMsg: BallHitMessage = {
      position: ballPos, // Already have it, no need to read again
      velocity: ball.linvel(), // Need fresh velocity after impulse
      angVelocity: ball.angvel(),
      spin: {
        x: this.physics.getBallSpin().x,
        y: this.physics.getBallSpin().y,
        z: this.physics.getBallSpin().z,
      },
      tick: this.lastCollisionTick, // Already calculated above
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
    this.physics.ball.body.setAngvel({ x: 0, y: 0, z: 0 }, true);

    this.networkSync.reset();
    this.lastCollisionTick = 0;
    this.lastTableBounceSide = null;
    this.serverSideBounced = false;
  }

  public BallServe(ballPos: Vector3, currentTick: number): void {
    this.isLocalServing = true;
    this.TossBallUp = true;

    const serveVelocity = new Vector3(0, this.SERVE_VELOCITY_Y, 0);

    this.physics.setBallFrozen(false);
    this.physics.setBallPosition(ballPos.x, ballPos.y, ballPos.z);
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
