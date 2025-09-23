import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Physics } from "@/components/Game/physics";
import { Ball } from "../entities/Ball";
import { Vec3, BallHistory } from "@/types/network";
import { GameState } from "./GameController";

export interface RollbackState {
  position: Vector3;
  velocity: Vector3;
  spin: Vector3;
  tick: number;
  applySpin: boolean;
}

export enum BallSyncResult {
  ROLLBACK_NEEDED,
  APPLY_IMMEDIATELY,
  FUTURE_TICK_WARNING,
  SNAP_DIRECTLY
}

export interface BallSyncInfo {
  result: BallSyncResult;
  receivedTick: number;
  currentTick: number;
  tickDifference: number;
}

export class RollbackManager {
  private ballHistory: BallHistory[] = [];
  private maxHistory: number = 60;
  private isRollbackInProgress: boolean = false;

  private physics: Physics;
  private ball: Ball;


  constructor(physics: Physics, ball: Ball) {
    this.physics = physics;
    this.ball = ball;
  }

  /** Called every frame */
  public recordState(currentTick: number): void {
    const state: BallHistory = {
      position: [
        this.physics.getBallPosition().x,
        this.physics.getBallPosition().y,
        this.physics.getBallPosition().z
      ],
      velocity: [
        this.physics.getBallVelocity().x,
        this.physics.getBallVelocity().y,
        this.physics.getBallVelocity().z
      ],
      spin: [
        this.physics.getBallSpin().x,
        this.physics.getBallSpin().y,
        this.physics.getBallSpin().z
      ],
      tick: currentTick
    };

    this.ballHistory.push(state);

    if (this.ballHistory.length > this.maxHistory) {
      this.ballHistory.shift();
    }
  }

  /** Decide what to do with incoming state */
  public analyzeSync(receivedTick: number, currentTick: number): BallSyncInfo {
    const tickDifference = currentTick - receivedTick;
    let result: BallSyncResult;

    if (tickDifference === 0) {
      result = BallSyncResult.APPLY_IMMEDIATELY;
    } else if (tickDifference > 0 && tickDifference <= 2) {
      result = BallSyncResult.APPLY_IMMEDIATELY;
    } else if (tickDifference > 2 && tickDifference <= 8) {
      result = BallSyncResult.ROLLBACK_NEEDED;
    } else if (tickDifference > 8) {
      result = BallSyncResult.SNAP_DIRECTLY;
    } else {
      result = BallSyncResult.FUTURE_TICK_WARNING;
    }

    return { result, receivedTick, currentTick, tickDifference };
  }

  /** Apply network state */
  public applyNetworkState(
    syncInfo: BallSyncInfo,
    position: Vec3,
    velocity: Vec3,
    spin?: Vec3,
    applySpin: boolean = true
  ): void {
    switch (syncInfo.result) {
      case BallSyncResult.ROLLBACK_NEEDED:
        this.rollback(syncInfo.receivedTick, syncInfo.currentTick, position, velocity, spin);
        break;
      case BallSyncResult.APPLY_IMMEDIATELY:
      case BallSyncResult.FUTURE_TICK_WARNING:
      case BallSyncResult.SNAP_DIRECTLY:
        this.applyState(position, velocity, spin, applySpin);
        break;
    }
  }

  /** Rollback + resimulate */
  private rollback(
    receivedTick: number,
    currentTick: number,
    position: Vec3,
    velocity: Vec3,
    spin?: Vec3
  ): void {
    console.log(`🔄 Rollback from tick ${currentTick} → ${receivedTick}`);
    this.isRollbackInProgress = true;

    this.applyState(position, velocity, spin);
    this.clearHistoryAfterTick(receivedTick);
    const ticksToResim = currentTick - receivedTick;
    for (let i = 1; i <= ticksToResim; i++) {
      this.physics.Step();
      this.recordState(receivedTick + i);
    }
    this.ball.setMeshPosition(this.physics.getBallPosition());
    this.isRollbackInProgress = false;
  }

  /** Apply a state */
  private applyState(position: Vec3, velocity: Vec3, spin?: Vec3, applySpin = true): void {
    this.physics.setBallPosition(position.x, position.y, position.z);
    this.physics.setBallVelocity(velocity.x, velocity.y, velocity.z);
    if (spin) {
      this.physics.setBallSpin(spin.x, spin.y, spin.z);
      this.physics.setApplySpin(applySpin);
    }
    else
      this.physics.setApplySpin(false);
    this.ball.setMeshPosition(this.physics.getBallPosition());
  }

  // ============== Helpers ==============
  // --- History helpers ---
  private clearHistoryAfterTick(tick: number): void {
    this.ballHistory = this.ballHistory.filter((b) => b.tick <= tick);
  }

  public getHistoryAtTick(tick: number): BallHistory | null {
    return this.ballHistory.find((state) => state.tick === tick) || null;
  }

  public getLatestHistory(): BallHistory | null {
    return this.ballHistory.length > 0
      ? this.ballHistory[this.ballHistory.length - 1]
      : null;
  }

  public clearHistory(): void {
    this.ballHistory = [];
  }

  public getHistoryLength(): number {
    return this.ballHistory.length;
  }

  // Debug methods
  // public debugPrintHistory(): void {
  //   console.log(`Rollback History (${this.ballHistory.length} entries):`);
  //   this.ballHistory.forEach((state, index) => {
  //     console.log(
  //       `[${index}] Tick: ${state.tick}, Pos: (${state.position.x.toFixed(
  //         2
  //       )}, ${state.position.y.toFixed(2)}, ${state.position.z.toFixed(2)})`
  //     );
  //   });
  // }

  public setMaxHistory(maxHistory: number): void {
    this.maxHistory = maxHistory;
    // Trim existing history if needed
    while (this.ballHistory.length > this.maxHistory) {
      this.ballHistory.shift();
    }
  }

  public isInProgress(): boolean {
    return this.isRollbackInProgress;
  }

}
