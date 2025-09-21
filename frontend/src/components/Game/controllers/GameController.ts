// debug paddle
import { Scene } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Network } from "../network/network";
import { Paddle } from "../entities/Paddle/GamePaddle";
import { Ball } from "../entities/Ball";
import { Physics } from "../physics";
import { RollbackManager } from "./RollbackManager";
import { BallHitMessage } from "@/types/network";

export enum GameState {
  WAITING_FOR_SERVE,
  IN_PLAY
}

export class GameController {
  private net: Network;
  private localPaddle!: Paddle;
  private opponentPaddle!: Paddle;
  private ball!: Ball;
  private physics!: Physics;
  private rollbackManager!: RollbackManager;
  // Sync
  private paddleSyncTimer: ReturnType<typeof setInterval> | null = null;
  private currentTick: number = 0;
  private lastCollisionTick: number = 0;

  // GameState
  public gameState: GameState = GameState.WAITING_FOR_SERVE;

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
    this.setCallbacks();

    this.net.on("opponent:paddle", (data) => {
      this.onOpponentPaddleState(data);
    });
  }

  private updateLocalPaddle(): void {
    if (!this.localPaddle) return;

    this.localPaddle.update();
  }

  // ================= Visual interpolation =================
  public updateVisuals(alpha: number): void {
    this.updateVisualsOpponentPaddle(alpha);
    this.updateVisualsBall(alpha);
  }
  /*
  * if serveState is FOLLOWING_PADDLE, position the ball in front of the local paddle
  * else, interpolate the ball position between previous and current physics positions
  */
  private updateVisualsBall(alpha: number): void {
    if (!this.ball || !this.physics) return;

    if (this.gameState === GameState.WAITING_FOR_SERVE) {
      this.attachBallToPaddle();
      return;
    }

    const justHadCollision = this.lastCollisionTick === this.currentTick;
    if (justHadCollision) {
      const currentPos = this.physics.getBallPosition();
      this.ball.setMeshPosition(currentPos);
    } else {
      const renderPos = Vector3.Lerp(this.physics.ball.getPrevPosition(), this.physics.ball.getCurrentPosition(), alpha);
      this.ball.setMeshPosition(renderPos);
    }
  }

  public updateVisualsOpponentPaddle(alpha: number): void {
    if (!this.opponentPaddle) return;

    const interpolatedPos = Vector3.Lerp(
      this.opponentPaddle.getPrevPosition(),
      this.opponentPaddle.getTarget().pos,
      alpha
    );

    const interpolatedRot = Vector3.Lerp(
      this.opponentPaddle.getPrevRotation(),
      this.opponentPaddle.getTarget().rot,
      alpha
    );

    this.opponentPaddle.mesh.position.copyFrom(interpolatedPos);
    this.opponentPaddle.mesh.rotation.copyFrom(interpolatedRot);
  }

  private attachBallToPaddle(): void {
    const paddlePos = this.localPaddle.getMeshPosition();
    const zOffset = this.localPaddle.isLocal === true ? 0.3 : -0.3;
    const newBallPos = paddlePos.add(new Vector3(0, 0, zOffset));

    this.ball.setMeshPosition(newBallPos);

    // TODO: not ideal to set physics position every frame
    // just when serving would be better
    // this.physics.setBallPosition(newBallPos.x, newBallPos.y, newBallPos.z);
  }


  // ================= Network =================
  /*
  * Handle incoming opponent paddle state that was received over the network
  */
  private onOpponentPaddleState(data: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
  }): void {
    if (!this.opponentPaddle) return;
    this.opponentPaddle.setPrevPosition();
    this.opponentPaddle.setPrevRotation();

    this.opponentPaddle.setTarget(
      { x: data.position.x, y: data.position.y, z: data.position.z },
      data.rotation.z
    );
  }

  /*
  * Start sending of local paddle state to the opponent over the network
  * at a fixed interval (30 times per second)
  */
  private startPaddleSync(): void {
    if (this.paddleSyncTimer) return; // avoid multiple intervals

    this.paddleSyncTimer = setInterval(() => {
      if (!this.net || !this.localPaddle) return;

      const pos = this.localPaddle.getMeshPosition();
      const rot = this.localPaddle.getMeshRotation();
      const vel = this.physics.paddle.getVelocity();

      this.net.sendMessage("player:paddle", {
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

  /*
  * Send the ball position to the opponent if local player is serving
  */



  // ================= collision callbacks =================
  setCallbacks() {
    if (!this.physics) return;

    this.physics.onBallPaddleCollision = (ball, paddle) => {
      const paddleVelocity = new Vector3(
        paddle.linvel().x,
        paddle.linvel().y,
        paddle.linvel().z
      );
      const paddleSpeed = paddleVelocity.length();

      if (
        this.rollbackManager?.isInProgress() ||
        this.lastCollisionTick === this.currentTick
      ) {
        return;
      }

      this.lastCollisionTick = this.currentTick;
      // const spinCalc = this.calculateMagnusSpin(
      //   paddleSpeed,
      //   paddleVelocity.x,
      //   this.paddle.side
      // );
      // const spinY = spinCalc.spinY;
      // this.physics!.setBallSpin(0, spinY, 0);
      // this.physics!.setApplySpin(spinCalc.applySpin);

      const targetVel = this.physics!.calculateTargetZYVelocity(
        ball.translation(),
        paddle.translation()
      );

      const currentVel = ball.linvel();
      const mass = ball.mass();
      const impulse = new Vector3(
        (targetVel.x - currentVel.x) * mass,
        (targetVel.y - currentVel.y) * mass,
        (targetVel.z - currentVel.z) * mass
      );
      this.physics!.ball.body.applyImpulse(impulse, true);

      const actualVel = ball.linvel();
      const hitMsg: BallHitMessage = {
        position: {
          x: ball.translation().x,
          y: ball.translation().y,
          z: ball.translation().z,
        },
        velocity: { x: actualVel.x, y: actualVel.y, z: actualVel.z },
        spin: {
          x: this.physics!.getBallSpin().x,
          y: this.physics!.getBallSpin().y,
          z: this.physics!.getBallSpin().z,
        },
        applySpin: this.physics!.getApplySpin(),
        tick: this.currentTick,
      };
      this.net.sendMessage("ball_hit", hitMsg);
    };
    this.physics.onBallFloorCollision = (ball, floor) => {
      // this.resetGame();
    };
    this.physics.onBallNetCollision = (ball, net) => {
      // this.resetGame();
    };
  }

  private calculateMagnusSpin(
    paddleSpeed: number,
    paddleVelocityX: number,
    paddleSide: number
  ): { spinY: number; applySpin: boolean } {
    let spinY = 0;
    let applySpin = false;

    if (paddleSpeed >= 26) {
      const clampedPaddleVelX = Math.max(-29, Math.min(29, paddleVelocityX));

      if (Math.abs(clampedPaddleVelX) > 26) {
        if (clampedPaddleVelX > 26) {
          spinY = ((clampedPaddleVelX - 26) / (29 - 26)) * 6;
        } else if (clampedPaddleVelX < -26) {
          spinY = ((clampedPaddleVelX + 26) / (-29 + 26)) * -6;
        }

        spinY *= paddleSide;
        applySpin = true;
      }
    }

    return { spinY, applySpin };
  }


  // ==================== Game loop methods =================
  public incrementTick(): void {
    this.currentTick++;
  }


  // ==================== Game state methods =================
  public pauseGame(): void {
    this.stopPaddleSync();
  }

  public resumeGame(): void {
    this.startPaddleSync();
  }

  public resetGame(): void {
  }


  // ==================== Game loop methods =================
  public fixedUpdate(dt: number): void {
    if (!this.ball || !this.physics) return;

    this.updateLocalPaddle();
    // this.physics.ball.setPosition("PREV");
    // this.physics.Step();
    // this.physics.ball.setPosition("CURR");
    // this.rollbackManager?.recordState();
    this.incrementTick();
    this.startPaddleSync();
  }
}
