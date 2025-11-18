// NetworkSync.ts - Network synchronization module
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Network } from "../network/network";
import { Paddle } from "../entities/Paddle/GamePaddle";
import { Ball } from "../entities/Ball";
import { Physics } from "../physics";
import { RollbackManager } from "./RollbackManager";
import { PaddleState } from "@/types/network";

export class NetworkSync {
  private net: Network;
  private ball: Ball;
  private physics: Physics;
  private localPaddle: Paddle;
  private opponentPaddle: Paddle;
  private playerId: string;

  private rollbackManager: RollbackManager;
  private paddleSyncTimer: ReturnType<typeof setInterval> | null = null;
  private ballSyncTimer: ReturnType<typeof setInterval> | null = null;

  private bufferOppPaddleStates: Array<{ time: number; data: PaddleState }> =
    [];
  private readonly MAX_BUFFER_SIZE: number = 6;
  private readonly PADDLE_SYNC_RATE: number = 30; // Hz
  private readonly BALL_SYNC_RATE: number = 30; // Hz
  private readonly INTERP_DELAY: number = 50; // ms

  constructor(
    net: Network,
    ball: Ball,
    physics: Physics,
    localPaddle: Paddle,
    opponentPaddle: Paddle,
    playerId: string,
  ) {
    this.net = net;
    this.ball = ball;
    this.physics = physics;
    this.localPaddle = localPaddle;
    this.opponentPaddle = opponentPaddle;
    this.playerId = playerId;
    this.rollbackManager = new RollbackManager(physics, ball);

    this.setupNetworkListeners();
  }

  private setupNetworkListeners(): void {
    // Opponent paddle updates
    this.net.on("opponent:paddle", (data: PaddleState) => {
      this.bufferOppPaddleStates.push({ time: performance.now(), data });
      if (this.bufferOppPaddleStates.length > this.MAX_BUFFER_SIZE) {
        this.bufferOppPaddleStates.shift();
      }
    });
  }

  // ================= Paddle Sync =================
  public startPaddleSync(): void {
    if (this.paddleSyncTimer) return;

    this.paddleSyncTimer = setInterval(() => {
      const pos = this.localPaddle.getMeshPosition();
      const rot = this.localPaddle.getMeshRotation();
      const vel = this.physics.paddle.getVelocity();

      this.net.sendMessage("player:paddle", {
        position: { x: pos.x, y: pos.y, z: pos.z },
        rotation: { x: rot.x, y: rot.y, z: rot.z },
        velocity: { x: vel.x, y: vel.y, z: vel.z },
      });
    }, 1000 / this.PADDLE_SYNC_RATE);
  }

  public stopPaddleSync(): void {
    if (this.paddleSyncTimer) {
      clearInterval(this.paddleSyncTimer);
      this.paddleSyncTimer = null;
    }
  }

  // ================= Ball Sync =================
  public startBallSync(): void {
    if (!this.net.isHost() || this.ballSyncTimer) return;

    this.ballSyncTimer = setInterval(() => {
      const pos = this.ball.getMeshPosition();
      this.net.sendMessage("Ball:state", {
        position: { x: pos.x, y: pos.y, z: pos.z },
      });
    }, 1000 / this.BALL_SYNC_RATE);
  }

  public stopBallSync(): void {
    if (this.ballSyncTimer) {
      clearInterval(this.ballSyncTimer);
      this.ballSyncTimer = null;
    }
  }

  public startSync(): void {
    this.startPaddleSync();
    this.startBallSync();
  }

  public stopSync(): void {
    this.stopPaddleSync();
    this.stopBallSync();
  }

  // ================= Interpolation =================
  private interpolatePaddleState(time: number): PaddleState | null {
    if (this.bufferOppPaddleStates.length < 2) return null;

    for (let i = 0; i < this.bufferOppPaddleStates.length - 1; i++) {
      const a = this.bufferOppPaddleStates[i];
      const b = this.bufferOppPaddleStates[i + 1];

      if (time >= a.time && time <= b.time) {
        const t = (time - a.time) / (b.time - a.time);
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        return {
          position: {
            x: lerp(a.data.position.x, b.data.position.x, t),
            y: lerp(a.data.position.y, b.data.position.y, t),
            z: lerp(a.data.position.z, b.data.position.z, t),
          },
          rotation: {
            x: lerp(a.data.rotation.x, b.data.rotation.x, t),
            y: lerp(a.data.rotation.y, b.data.rotation.y, t),
            z: lerp(a.data.rotation.z, b.data.rotation.z, t),
          },
          velocity: {
            x: lerp(a.data.velocity.x, b.data.velocity.x, t),
            y: lerp(a.data.velocity.y, b.data.velocity.y, t),
            z: lerp(a.data.velocity.z, b.data.velocity.z, t),
          },
        };
      }
    }

    return this.bufferOppPaddleStates[this.bufferOppPaddleStates.length - 1]
      .data;
  }

  public updateVisualsOpponentPaddle(): void {
    const renderTime = performance.now() - this.INTERP_DELAY;
    const interpState = this.interpolatePaddleState(renderTime);
    if (!interpState) return;

    const pos = new Vector3(
      interpState.position.x,
      interpState.position.y,
      interpState.position.z,
    );
    const rot = new Vector3(0, 0, interpState.rotation.z);

    this.opponentPaddle.mesh.position.copyFrom(pos);
    this.opponentPaddle.mesh.rotation.copyFrom(rot);
  }

  // ================= Rollback =================
  public recordState(tick: number): void {
    this.rollbackManager.recordState(tick);
  }

  public applyNetworkBallState(
    tick: number,
    currentTick: number,
    position: { x: number; y: number; z: number },
    velocity: { x: number; y: number; z: number },
    angVelocity: { x: number; y: number; z: number },
    spin: { x: number; y: number; z: number },
  ): void {
    const syncInfo = this.rollbackManager.analyzeSync(tick, currentTick);
    this.rollbackManager.applyNetworkState(
      syncInfo,
      position,
      velocity,
      angVelocity,
      spin,
    );
  }

  public reset(): void {
    this.rollbackManager.reset();
    this.bufferOppPaddleStates = [];
  }

  // Expose rollback manager for game logic
  public getRollbackManager(): RollbackManager {
    return this.rollbackManager;
  }
}
