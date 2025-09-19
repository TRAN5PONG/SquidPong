// debug paddle
import { Scene, Vector3 } from "@babylonjs/core";
import { Network } from "../network/network";
import { Paddle } from "../entities/Paddle/GamePaddle";
import { Ball } from "../entities/Ball";
import { Physics } from "../physics";
import { RollbackManager } from "./RollbackManager";

export enum ServeBall {
  FOLLOWING_PADDLE,
  IN_PLAY,
}

export class GameController {
  private net: Network;
  private localPaddle: Paddle | null = null;
  private opponentPaddle: Paddle | null = null;
  private ball: Ball | null = null;
  private physics!: Physics;
  private rollbackManager!: RollbackManager;
  // Sync
  private paddleSyncTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    localPaddle: Paddle,
    opponentPaddle: Paddle,
    ball: Ball,
    physics: Physics,
    net: Network
  ) {
    this.localPaddle = localPaddle;
    this.opponentPaddle = opponentPaddle;
    this.ball = ball;
    this.physics = physics;
    this.net = net;
    this.rollbackManager = new RollbackManager(physics, ball);
  }

  private updateLocalPaddle(): void {
    if (!this.localPaddle) return;

    this.localPaddle.setMeshPosition();
    if (this.physics) {
      const meshPos = this.localPaddle.getMeshPosition();
      this.physics.setPaddleTargetPosition(meshPos.x, meshPos.y, meshPos.z);
    }
  }

  private startPaddleSync(): void {
    if (this.paddleSyncTimer) return; // avoid multiple intervals

    this.paddleSyncTimer = setInterval(() => {
      if (!this.net || !this.localPaddle) return;

      const pos = this.localPaddle.getMeshPosition();
      const rot = this.localPaddle.getMeshRotation();
      const vel = this.physics.paddle.getVelocity();

      this.net.sendMessage("PaddleState", {
        position: { x: pos.x, y: pos.y, z: pos.z },
        rotation: { x: rot.x, y: rot.y, z: rot.z },
        velocity: { x: vel.x, y: vel.y, z: vel.z },
      });
    }, 1000 / 30);
  }

  private stopPaddleSync(): void {
    if (this.paddleSyncTimer) {
      clearInterval(this.paddleSyncTimer);
      this.paddleSyncTimer = null;
    }
  }

  public updateVisuals(alpha: number): void {
    this.updateVisualsOpponentPaddle(alpha);
    // this.updateVisualsBall(alpha);
  }

  public updateVisualsOpponentPaddle(alpha: number): void {
    if (!this.opponentPaddle) return;

    const interpolatedPos = Vector3.Lerp(
      this.opponentPaddle.getPrevPosition(),
      this.opponentPaddle.getCurrentPosition(),
      alpha
    );

    const interpolatedRot = Vector3.Lerp(
      this.opponentPaddle.getPrevRotation(),
      this.opponentPaddle.getCurrentRotation(),
      alpha
    );

    this.opponentPaddle.mesh.position.copyFrom(interpolatedPos);
    this.opponentPaddle.mesh.rotation.copyFrom(interpolatedRot);
  }

  private onOpponentPaddleState(): void {
    // TODO: Get oppenent paddle from network
    // this.opponentPaddle.setTarget(Pos, Rot);
  }

  // === Game logic
  public pauseGame(): void {
    this.stopPaddleSync();
  }
  public fixedUpdate(dt: number): void {
    if (!this.ball || !this.physics) return;

    this.updateLocalPaddle();
    // this.physics.ball.setPosition("PREV");
    // this.physics.Step();
    // this.physics.ball.setPosition("CURR");
    // this.rollbackManager?.recordState();
    // this.rollbackManager.incCurrentTick();
    this.startPaddleSync();
  }
}
