// debug paddle
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Network } from "../network/network";
import { Paddle } from "../entities/Paddle/GamePaddle";
import { Ball } from "../entities/Ball";
import { Physics } from "../physics";
import { RollbackManager } from "./RollbackManager";
import { BallHitMessage, PaddleState } from "@/types/network";
import { Scene } from "@babylonjs/core";
import { PointerEventTypes } from "@babylonjs/core";

export enum GameState {
  WAITING_FOR_SERVE,
  IN_PLAY,
}

export class GameController {
  private net: Network;
  private localPaddle!: Paddle;
  private opponentPaddle!: Paddle;
  private ball!: Ball;
  private physics!: Physics;
  private rollbackManager!: RollbackManager;
  private scene: Scene;
  // Sync
  private paddleSyncTimer: ReturnType<typeof setInterval> | null = null;
  private currentTick: number = 0;
  private lastCollisionTick: number = 0;
  public MyTurnToServe: boolean = false;

  // GameState
  public gameState: GameState = GameState.WAITING_FOR_SERVE;

  private bufferOppPaddleStates: Array<{ time: number; data: PaddleState }> =
    [];
  private readonly MAX_SIZE: number = 20;
  constructor(
    localPaddle: Paddle,
    opponentPaddle: Paddle,
    ball: Ball,
    physics: Physics,
    net: Network,
    scene: Scene,
  ) {
    this.localPaddle = localPaddle;
    this.opponentPaddle = opponentPaddle;
    this.ball = ball;
    this.physics = physics;
    this.net = net;
    this.rollbackManager = new RollbackManager(physics, ball);
    this.setCallbacks();
    this.scene = scene;

    // For now, right paddle always serves first just for testing
    this.MyTurnToServe = this.localPaddle.side === "RIGHT" ? true : false;

    // Listen for opponent paddle updates
    this.net.on("opponent:paddle", (data) => {
      this.onOpponentPaddleState(data);
    });
    // Listen for ball hit updates
    this.net.on("BallHitMessage", (data: BallHitMessage) => {
      this.gameState = GameState.IN_PLAY;
      const syncInfo = this.rollbackManager.analyzeSync(
        data.tick,
        this.currentTick,
      );

      this.rollbackManager.applyNetworkState(
        syncInfo,
        data.position,
        data.velocity,
        data.spin,
        data.applySpin,
      );
    });

    // Listen for mouse click to serve
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        const event = pointerInfo.event as PointerEvent;
        if (
          event.button === 0 &&
          this.MyTurnToServe &&
          this.gameState == GameState.WAITING_FOR_SERVE
        ) {
          // left click
          console.log("Pointer down event detected");
          this.BallServe();
          this.gameState = GameState.IN_PLAY;
        }
      }
    });
  }

  private updateLocalPaddle(): void {
    if (!this.localPaddle) return;

    this.localPaddle.update();
  }

  // ================= Visual interpolation =================
  public updateVisuals(alpha: number): void {
    this.updateVisualsOpponentPaddle();
    this.updateVisualsBall(alpha);
  }
  /*
   * if GameState is WAITING_FOR_SERVE, position the ball in front of the local paddle
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
      const renderPos = Vector3.Lerp(
        this.physics.ball.getPrevPosition(),
        this.physics.ball.getCurrentPosition(),
        alpha,
      );
      this.ball.setMeshPosition(renderPos);
    }
  }

  public getInterpolated(time: number): PaddleState | null {
    if (this.bufferOppPaddleStates.length < 2) return null;

    // find two states that bracket the target time
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

    // if time is newer than the latest buffered state, return the last one
    return this.bufferOppPaddleStates[this.bufferOppPaddleStates.length - 1]
      .data;
  }

  public updateVisualsOpponentPaddle(): void {
    if (!this.opponentPaddle) return;

    const renderTime = performance.now() - 50; // 100ms latency compensation
    const interpState = this.getInterpolated(renderTime);
    if (!interpState) return;

    const interpolatedPos = new Vector3(
      interpState.position.x,
      interpState.position.y,
      interpState.position.z,
    );
    const interpolatedRot = new Vector3(0, 0, interpState.rotation.z);
    this.opponentPaddle.mesh.position.copyFrom(interpolatedPos);
    this.opponentPaddle.mesh.rotation.copyFrom(interpolatedRot);
  }

  private attachBallToPaddle(): void {
    let paddlePos;
    let zOffset;
    if (this.MyTurnToServe) {
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

    // TODO: not ideal to set physics position every frame
    // just when serving would be better
    // this.physics.setBallPosition(newBallPos.x, newBallPos.y, newBallPos.z);
  }

  // ================= Network =================
  /*
   * Handle incoming opponent paddle state that was received over the network
   */
  private onOpponentPaddleState(data: PaddleState): void {
    if (!this.opponentPaddle) return;

    this.bufferOppPaddleStates.push({ time: performance.now(), data });
    if (this.bufferOppPaddleStates.length > this.MAX_SIZE) {
      this.bufferOppPaddleStates.shift();
    }

    this.opponentPaddle.setPrevPosition();
    this.opponentPaddle.setPrevRotation();

    this.opponentPaddle.setTarget(
      { x: data.position.x, y: data.position.y, z: data.position.z },
      data.rotation.z,
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

  // ================= collision callbacks =================
  setCallbacks() {
    if (!this.physics) return;

    this.physics.onBallPaddleCollision = (ball, paddle) => {
      const paddleVelocity = new Vector3(
        paddle.linvel().x,
        paddle.linvel().y,
        paddle.linvel().z,
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
        paddle.translation(),
      );

      const currentVel = ball.linvel();
      const mass = ball.mass();
      const impulse = new Vector3(
        (targetVel.x - currentVel.x) * mass,
        (targetVel.y - currentVel.y) * mass,
        (targetVel.z - currentVel.z) * mass,
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
      this.net.sendMessage("ball:hit", hitMsg);
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
    paddleSide: number,
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

  public resetGame(): void { }

  // ==================== Serve methods =================
  public BallServe(): void {
    this.physics.setBallFrozen(false);
    const serveVelocity = new Vector3(0, 2.5, 0);
    const ballPos = this.ball.getMeshPosition();

    this.physics.setBallPosition(ballPos.x, ballPos.y, ballPos.z);
    this.physics.setBallVelocity(
      serveVelocity.x,
      serveVelocity.y,
      serveVelocity.z,
    );

    // Sync serve to opponent
    const serveMsg: BallHitMessage = {
      position: { x: ballPos.x, y: ballPos.y, z: ballPos.z },
      velocity: { x: serveVelocity.x, y: serveVelocity.y, z: serveVelocity.z },
      spin: { x: 0, y: 0, z: 0 },
      applySpin: false,
      tick: this.currentTick,
    };
    this.net.sendMessage("ball:hit", serveMsg);
  }

  // ==================== Main update methods =================
  public fixedUpdate(): void {
    if (!this.ball || !this.physics) return;

    this.updateLocalPaddle();
    this.physics.ball.setPosition("PREV");
    this.physics.Step();
    this.physics.ball.setPosition("CURR");

    // if (this.serveState === GameState.IN_PLAY)
    this.rollbackManager?.recordState(this.currentTick);
    this.incrementTick();
    this.startPaddleSync();
  }
}
