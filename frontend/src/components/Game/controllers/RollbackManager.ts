import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Physics } from "@/components/Game/physics";
import { Ball } from "../entities/Ball";
import { Vec3, BallHistory } from "@/types/network";

export interface RollbackState {
  position: Vector3;
  velocity: Vector3;
  spin: Vector3;
  tick: number;
}

export enum BallSyncResult {
  ROLLBACK_NEEDED,
  APPLY_IMMEDIATELY,
  FUTURE_TICK_WARNING,
  SNAP_DIRECTLY,
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
        this.physics.getBallPosition().z,
      ],
      velocity: [
        this.physics.getBallVelocity().x,
        this.physics.getBallVelocity().y,
        this.physics.getBallVelocity().z,
      ],
      spin: [
        this.physics.getBallSpin().x,
        this.physics.getBallSpin().y,
        this.physics.getBallSpin().z,
      ],
      tick: currentTick,
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
    angVelocity: Vec3,
    spin?: Vec3,
  ): void {
    switch (syncInfo.result) {
      case BallSyncResult.ROLLBACK_NEEDED:
        this.rollback(
          syncInfo.receivedTick,
          syncInfo.currentTick,
          position,
          velocity,
          angVelocity,
          spin,
        );
        break;
      case BallSyncResult.APPLY_IMMEDIATELY:
      case BallSyncResult.FUTURE_TICK_WARNING:
      case BallSyncResult.SNAP_DIRECTLY:
        this.applyState(position, velocity, angVelocity, spin);
        break;
    }
  }

  /** Rollback + resimulate */
  private rollback(
    receivedTick: number,
    currentTick: number,
    position: Vec3,
    velocity: Vec3,
    angVelocity: Vec3,
    spin?: Vec3,
  ): void {
    this.isRollbackInProgress = true;

    const rollbackBase = this.getHistoryAtTick(receivedTick);
    if (!rollbackBase) {
      console.warn(`⚠️ Rollback failed: No history for tick ${receivedTick}`);
      this.applyState(position, velocity, angVelocity, spin);
      this.clearHistory();
      this.recordState(currentTick);
      this.isRollbackInProgress = false;
      return;
    }
    // Restore state
    this.physics.setBallPosition(...rollbackBase.position);
    this.physics.setBallVelocity(...rollbackBase.velocity);
    this.physics.setBallSpin(...rollbackBase.spin);
    this.physics.ball.body.setAngvel(
      { x: angVelocity.x, y: angVelocity.y, z: angVelocity.z },
      true,
    );

    // Apply received state
    this.applyState(position, velocity, angVelocity, spin);

    // Clear future history
    this.clearHistoryAfterTick(receivedTick);

    // Resimulate to current tick
    const ticksToResim = currentTick - receivedTick;
    for (let i = 1; i <= ticksToResim; i++) {
      this.physics.Step();
      this.recordState(receivedTick + i);
    }

    // this.ball.setMeshPosition(this.physics.getBallPosition());

    // TODO: Test this smooth update
    // Smoothly update the visual mesh
    const newPos = this.physics.getBallPosition();
    this.ball.mesh.position = new Vector3(
      this.ball.mesh.position.x + (newPos.x - this.ball.mesh.position.x) * 0.5,
      this.ball.mesh.position.y + (newPos.y - this.ball.mesh.position.y) * 0.5,
      this.ball.mesh.position.z + (newPos.z - this.ball.mesh.position.z) * 0.5,
    );

    this.isRollbackInProgress = false;
  }

  /** Apply a state */
  private applyState(
    position: Vec3,
    velocity: Vec3,
    angVelocity: Vec3,
    spin?: Vec3,
  ): void {
    this.physics.setBallPosition(position.x, position.y, position.z);
    this.physics.setBallVelocity(velocity.x, velocity.y, velocity.z);
    this.physics.ball.body.setAngvel(
      { x: angVelocity.x, y: angVelocity.y, z: angVelocity.z },
      true,
    );
    if (spin && spin.y !== 0) {
      this.physics.setBallSpin(spin.x, spin.y, spin.z);
      this.ball.activateSmokeEffect();
    } else {
      this.ball.deactivateSmokeEffect();
    }
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

  public reset(): void {
    this.ballHistory = [];
    this.isRollbackInProgress = false;
  }
}
