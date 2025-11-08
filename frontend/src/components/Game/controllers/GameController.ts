// debug paddle
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Network } from "../network/network";
import { Paddle } from "../entities/Paddle/GamePaddle";
import { Ball } from "../entities/Ball";
import { Physics } from "../physics";
import { RollbackManager } from "./RollbackManager";
import { BallHitMessage, PaddleState } from "@/types/network";
import { Scene, Plane } from "@babylonjs/core";
import { PointerEventTypes } from "@babylonjs/core";

// debug paddle
import { DebugMeshManager } from "../../Game/DebugMeshManager.ts";

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
  private readonly MAX_SIZE: number = 6;

  // TEST: Mouse tracking
  private clampedX: number = 0;
  private clampedZ: number = 0;
  private paddlePlane: Plane | null = null;

  // Debug
  private debugMeshes: DebugMeshManager;
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

    // Debug
    this.debugMeshes = new DebugMeshManager(this.scene);
    // this.debugMeshes.createMeshes();

    // For now, right paddle always serves first just for testing
    this.MyTurnToServe = this.localPaddle.side === "RIGHT" ? true : false;

    // Listen for opponent paddle updates
    this.net.on("opponent:paddle", (data) => {
      this.onOpponentPaddleState(data);
    });
    // Listen for ball hit updates
    this.net.on("Ball:HitMessage", (data: BallHitMessage) => {
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
    // Listen for ball serve updates
    this.net.on("Ball:Serve", (data: BallHitMessage) => {
      this.gameState = GameState.IN_PLAY;
      this.physics.setBallFrozen(false);
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

    // TEST:
    // this.setupPaddlePlane();
    // this.enableLiveMouseTracking();
  }

  // TEST:
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
    ); // y=2.8 plane
    const distance = ray.intersectsPlane(plane);
    if (distance === null) return Vector3.Zero();

    return ray.origin.add(ray.direction.scale(distance));
  }

  private enableLiveMouseTracking(): void {
    this.scene.onBeforeRenderObservable.add(() => {
      if (!this.paddlePlane) return;
      const pointerX = this.scene.pointerX;
      const pointerY = this.scene.pointerY;
      if (pointerX === undefined || pointerY === undefined) return;

      const ray = this.scene.createPickingRay(
        pointerX,
        pointerY,
        null,
        this.scene.activeCamera,
      );
      const distance = ray.intersectsPlane(this.paddlePlane);
      if (distance === null) return;

      const boundaries = this.localPaddle.getBoundaries();
      const point = ray.origin.add(ray.direction.scale(distance));

      this.clampedX = Math.max(
        boundaries.x.min,
        Math.min(boundaries.x.max, point.x),
      );
      this.clampedZ = Math.max(
        boundaries.z.min,
        Math.min(boundaries.z.max, point.z),
      );
    });
  }

  private setupPaddlePlane(): void {
    const planePosition = new Vector3(
      0,
      this.localPaddle.getMeshPosition().y,
      0,
    );
    const planeNormal = new Vector3(0, 1, 0);
    this.paddlePlane = Plane.FromPositionAndNormal(planePosition, planeNormal);
  }

  private updateLocalPaddle(): void {
    if (!this.localPaddle) return;

    // this.localPaddle.update();

    // dubeg
    const position = this.physics.getPaddlePosition();
    const rotation = this.localPaddle.getMeshRotation();
    // this.debugMeshes.updatePaddle(position, rotation);
    // this.debugMeshes.paddleMesh!.position.copyFrom(position);
  }

  // ================= Visual interpolation =================
  public updateVisuals(alpha: number): void {
    // TEST:
    this.localPaddle.updateVisual(alpha);

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

    // debug
    const ballPos = this.ball.getMeshPosition();
    // this.debugMeshes.updateBall(ballPos);
  }

  public getInterpolated(time: number): PaddleState | null {
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
      const spinCalc = this.calculateMagnusSpin(
        paddleSpeed,
        paddleVelocity.x,
        this.localPaddle.side === "RIGHT" ? -1 : 1,
      );
      const spinY = spinCalc.spinY;
      this.physics!.setBallSpin(0, spinY, 0);
      this.physics!.setApplySpin(spinCalc.applySpin);

      const ballVel = this.physics!.calculateTargetZYVelocity(
        ball.translation(),
        paddle.translation(),
      );

      const currentVel = ball.linvel();
      const mass = ball.mass();

      // is For applying impulse to change ball velocity on hit
      // Impulse = mass * change in velocity (ivnitial - final)
      const impulse = new Vector3(
        (ballVel.x - currentVel.x) * mass,
        (ballVel.y - currentVel.y) * mass,
        (ballVel.z - currentVel.z) * mass,
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
      this.net.sendMessage("Ball:HitMessage", hitMsg);
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
    this.net.sendMessage("Ball:Serve", serveMsg);
  }

  // ==================== Main update methods =================
  public fixedUpdate(): void {
    if (!this.ball || !this.physics) return;
    // TEST:
    const pointerX = this.scene.pointerX;
    const pointerY = this.scene.pointerY;

    const worldPos = this.screenToWorld(pointerX, pointerY);
    this.physics.paddle.setTarget(worldPos.x, worldPos.y, worldPos.z);

    // TEST:
    this.updateLocalPaddle();

    this.physics.ball.setPosition("PREV");
    this.physics.Step(1 / 60);
    this.physics.ball.setPosition("CURR");

    // if (this.serveState === GameState.IN_PLAY)
    this.rollbackManager?.recordState(this.currentTick);
    this.incrementTick();

    // console.log(`Current Tick: ${this.currentTick}`);
    // const timeMin = Math.floor(this.currentTick / 60);
    // const timeSec = this.currentTick % 60;
    // console.log(`Time Elapsed: ${timeMin}m ${timeSec}s`);

    this.startPaddleSync();
  }
}
