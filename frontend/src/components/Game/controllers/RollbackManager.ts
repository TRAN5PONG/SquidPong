import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Physics } from "@/components/Game/physics";
import { Ball } from "../entities/Ball";
import { Vec3, BallHistory } from "@/types/network";
import { ServeBall } from "./GameController";

export interface RollbackState {
  position: Vector3;
  velocity: Vector3;
  spin: Vector3;
  tick: number;
  applySpin: boolean;
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

  public isInProgress(): boolean {
    return this.isRollbackInProgress;
  }

  public recordState(currentTick: number, serveState: ServeBall): void {
    if (serveState === ServeBall.IN_PLAY) {
      const state: BallHistory = {
        position: this.physics.getBallPosition().clone(),
        velocity: this.physics.getBallVelocity().clone(),
        spin: this.physics.getBallSpin().clone(),
        tick: currentTick,
      };
      this.ballHistory.push(state);

      if (this.ballHistory.length > this.maxHistory) {
        this.ballHistory.shift();
      }
    }
  }

  public rollback(
    receivedTick: number,
    currentTick: number,
    position: Vec3,
    velocity: Vec3,
    spin?: Vec3,
    serveState?: ServeBall
  ): void {
    console.log(`Rolling back from tick ${currentTick} to ${receivedTick}`);
    this.isRollbackInProgress = true;

    const tickDifference = currentTick - receivedTick;

    // Handle rollback that's too far back
    if (tickDifference > 10) {
      this.applyDirectState(position, velocity, spin);
      this.isRollbackInProgress = false;
      return;
    }

    // Apply the authoritative state at the rollback point
    this.applyState(position, velocity, spin);

    // Clear history after the rollback point
    this.clearHistoryAfterTick(receivedTick);

    // Re-simulate from rollback point to current
    this.resimulate(receivedTick, currentTick, serveState);

    this.updateVisuals();

    this.isRollbackInProgress = false;
  }

  private applyDirectState(position: Vec3, velocity: Vec3, spin?: Vec3): void {
    console.warn(`Rollback too far, applying state directly`);
    this.applyState(position, velocity, spin);
    this.updateVisuals();
  }

  private applyState(position: Vec3, velocity: Vec3, spin?: Vec3): void {
    this.physics.setBallPosition(position.x, position.y, position.z);
    this.physics.setBallVelocity(velocity.x, velocity.y, velocity.z);

    if (spin) {
      this.physics.setBallSpin(spin.x, spin.y, spin.z);
      this.physics.setApplySpin(true);
    } else {
      this.physics.setApplySpin(false);
    }
  }

  private clearHistoryAfterTick(tick: number): void {
    this.ballHistory = this.ballHistory.filter((b) => b.tick <= tick);
  }

  private resimulate(
    fromTick: number,
    toTick: number,
    serveState?: ServeBall
  ): void {
    const ticksToResimulate = toTick - fromTick;

    for (let i = 1; i <= ticksToResimulate; i++) {
      this.physics.Step();

      // Record the re-simulated state
      if (serveState === ServeBall.IN_PLAY) {
        this.ballHistory.push({
          position: this.physics.getBallPosition().clone(),
          velocity: this.physics.getBallVelocity().clone(),
          spin: this.physics.getBallSpin().clone(),
          tick: fromTick + i,
        });
      }
    }
  }

  private updateVisuals(): void {
    this.ball.setMeshPosition(this.physics.getBallPosition());
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
  public debugPrintHistory(): void {
    console.log(`Rollback History (${this.ballHistory.length} entries):`);
    this.ballHistory.forEach((state, index) => {
      console.log(
        `[${index}] Tick: ${state.tick}, Pos: (${state.position.x.toFixed(
          2
        )}, ${state.position.y.toFixed(2)}, ${state.position.z.toFixed(2)})`
      );
    });
  }

  public setMaxHistory(maxHistory: number): void {
    this.maxHistory = maxHistory;
    // Trim existing history if needed
    while (this.ballHistory.length > this.maxHistory) {
      this.ballHistory.shift();
    }
  }
}
