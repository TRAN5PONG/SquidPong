// debug paddle
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Network } from "../network/network";
import { Paddle } from "../entities/Paddle/GamePaddle";
import { Ball } from "../entities/Ball";
import { Physics } from "../physics";
import { RollbackManager } from "./RollbackManager";
import {
  BallHitMessage,
  ballResetMessage,
  PaddleState,
  ballTossMessage,
} from "@/types/network";
import { Scene, Plane } from "@babylonjs/core";
import { PointerEventTypes } from "@babylonjs/core";
import { BallTrajectory } from "../physics/ballTrajectory";
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
  private ballSyncTimer: ReturnType<typeof setInterval> | null = null;

  private currentTick: number = 0;
  private lastCollisionTick: number = 0;
  public MyTurnToServe: boolean = false;

  // GameState
  public gameState: GameState = GameState.WAITING_FOR_SERVE;

  // Bounce Logic
  private lastTableBounceSide: "LEFT" | "RIGHT" | null = null;
  private lasthitPlayerId: string | null = null;
  private serverSideBounced: boolean = false;
  private isLocalServing: boolean = false;
  private isPointEnded: boolean = false;
  private TossBallUp: boolean = false;

  private bufferOppPaddleStates: Array<{ time: number; data: PaddleState }> =
    [];
  private readonly MAX_SIZE: number = 6;

  // TEST: Mouse tracking

  // Player Id
  private playerId: string = "";
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
    this.playerId = this.net.getPlayerId()!;
    this.physics.setPlayerId(this.playerId);

    // Debug
    this.debugMeshes = new DebugMeshManager(this.scene);
    // this.debugMeshes.createMeshes();

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
        data.applyEffect,
        data.spin,
        data.applySpin,
      );
    });
    // Listen for ball serve updates
    this.net.on("Ball:Serve", (data: BallHitMessage) => {
      // this.lasthitPlayerId = data.playerId;
      this.physics.setBallFrozen(false);

      this.physics.setBallPosition(
        data.position.x,
        data.position.y,
        data.position.z,
      );
      this.physics.setBallVelocity(
        data.velocity.x,
        data.velocity.y,
        data.velocity.z,
      );
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
    // Listen for ball toss updates
    this.net.on("Ball:Toss", (data: ballTossMessage) => {
      this.physics.setBallFrozen(false);
      this.TossBallUp = true;

      // print tick
      const syncInfo = this.rollbackManager.analyzeSync(
        data.tick,
        this.currentTick,
      );

      this.rollbackManager.applyNetworkState(
        syncInfo,
        data.position,
        data.velocity,
        undefined,
        false,
      );
    });

    // Listen for ball reset (new round)
    this.net.on("Ball:Reset", (data: ballResetMessage) => {
      this.resetRound(data);
    });

    // Listen for serve Turn updates
    this.net.on("serve:Turn", (currentServerId: string) => {
      this.MyTurnToServe = currentServerId === this.playerId;
    });

    // Listen Last Hit Player updates
    this.net.on("lastHitPlayer:updated", (lastHitPlayerId: string) => {
      this.lasthitPlayerId = lastHitPlayerId;
    });

    // Listen for serve state changes
    this.net.on("serveState:changed", (serveState: string) => {
      this.gameState =
        serveState === "in_play"
          ? GameState.IN_PLAY
          : GameState.WAITING_FOR_SERVE;
      this.isLocalServing = false;
    });

    // TEST:
    this.net.on("host:migrated", (data) => {
      if (this.net.isHost()) {
        console.log("📡 I'm now host - taking authority");
        console.log("My id is:", this.playerId);
        console.log("new host id is:", data.newHostId);
      }
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
          this.BallServe();
        }
      }
    });
  }

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
    if (distance === null)
      return new Vector3(0, 2.8, this.localPaddle.side === "LEFT" ? -3 : 3);

    return ray.origin.add(ray.direction.scale(distance));
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

  /*
   * if GameState is WAITING_FOR_SERVE, position the ball in front of the local paddle
   * else, interpolate the ball position between previous and current physics positions
   */
  private updateVisualsBall(alpha: number): void {
    if (!this.ball || !this.physics) return;

    if (
      this.gameState === GameState.WAITING_FOR_SERVE &&
      !this.isLocalServing &&
      !this.TossBallUp
    ) {
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

  private startBallSync(): void {
    // Only host sends ball state
    if (!this.net.isHost()) return;

    // Avoid multiple intervals
    if (this.ballSyncTimer) return;

    this.ballSyncTimer = setInterval(() => {
      if (!this.net || !this.ball || !this.physics) return;

      const pos = this.physics.getBallPosition();
      const vel = this.physics.getBallVelocity();

      this.net.sendMessage("Ball:state", {
        position: { x: pos.x, y: pos.y, z: pos.z },
        velocity: { x: vel.x, y: vel.y, z: vel.z },
        tick: this.currentTick,
      });
    }, 1000 / 30); // 30 FPS
  }

  private stopBallSync(): void {
    if (this.ballSyncTimer) {
      clearInterval(this.ballSyncTimer);
      this.ballSyncTimer = null;
    }
  }

  /*
   * Stop sending of local paddle state
   */
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

      this.lasthitPlayerId = this.playerId;
      this.lastTableBounceSide = null;
      this.lastCollisionTick = this.currentTick;

      let ballVel: Vector3;
      let isServe = false; // Track if this is a serve

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
      } else {
        // === RALLY HIT ===
        const spinCalc = this.calculateMagnusSpin(
          paddleSpeed,
          paddleVelocity.x,
        );

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

      const currentVel = ball.linvel();
      const mass = ball.mass();

      const dir = this.localPaddle.side === "LEFT" ? 1 : -1;
      const impulse = new Vector3(
        (ballVel.x - currentVel.x) * mass * dir,
        (ballVel.y - currentVel.y) * mass,
        (ballVel.z - currentVel.z) * mass,
      );
      this.physics.ball.body.applyImpulse(impulse, true);

      const ballSpeed = new Vector3(
        ball.linvel().x,
        ball.linvel().y,
        ball.linvel().z,
      ).length();

      let applyEffect = true;
      if (ballSpeed > 14) {
        this.ball.activateFireEffect();
        applyEffect = true;
      } else {
        this.ball.deactivateFireEffect();
      }

      console.log("ball speed before hit:", ballSpeed.toFixed(2));

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
        tick: this.currentTick,
        playerId: this.net.getPlayerId()!,
        applyEffect: applyEffect,
      };

      if (isServe) {
        this.net.sendMessage("Ball:Serve", hitMsg);
      } else {
        this.net.sendMessage("Ball:HitMessage", hitMsg);
      }
    };
    // Ball with floor collision callback
    this.physics.onBallFloorCollision = (ball, floor) => {
      console.log("Ball hit the floor");
      if (this.shouldISendThisEvent(ball)) {
        this.ballOut();
      }
    };
    // Ball with net collision callback
    this.physics.onBallNetCollision = (ball, net) => {
      console.log("Ball hit the net");
      if (this.shouldISendThisEvent(ball)) {
        this.ballOut();
      }
    };
    // ball with Table collision callback
    this.physics.onBallTableCollision = (ball, table) => {
      console.log("Ball hit the table");
      if (this.shouldISendThisEvent(ball)) {
        this.handleTableBounce(ball);
      }
    };
  }

  private shouldISendThisEvent(ball: any): boolean {
    if (this.isPointEnded) {
      return false;
    }

    return this.net.isHost();
  }

  private ballOut(): void {
    if (this.isPointEnded) {
      return;
    }

    if (!this.net.isHost()) {
      console.log("⚠️ Not host - not sending Ball:Out event");
      return;
    }
    this.isPointEnded = true;

    // printd id for the sender of the Ball:Out event
    console.log(`⚠️ Ball is out! Sent by player ID: ${this.playerId}`);
    const faultPlayer = this.lasthitPlayerId || this.playerId;
    this.net.sendMessage("Ball:Out", {
      playerId: faultPlayer,
    });
  }

  private handleTableBounce(ball: any): void {
    const ballZ = ball.translation().z;
    const currentSide: "LEFT" | "RIGHT" = ballZ > 0 ? "RIGHT" : "LEFT";
    const lastHitterSide = this.getPlayerSide(this.lasthitPlayerId);
    const serverSide = this.getPlayerSide(
      this.MyTurnToServe ? this.playerId : this.getOpponentId(),
    );

    if (!this.shouldISendThisEvent(ball)) {
      return;
    }

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

      // Valid first bounce on server's side
      this.serverSideBounced = true;
      this.lastTableBounceSide = currentSide;
      return;
    }

    // --- SECOND BOUNCE (Still part of serve or rally) ---
    // Check if this is a double bounce (fault)
    if (this.lastTableBounceSide === currentSide) {
      this.ballOut();
      return;
    }

    // Check if ball bounced on hitter's own side (fault)
    if (lastHitterSide && currentSide === lastHitterSide) {
      this.ballOut();
      return;
    }

    // Valid bounce on opponent's side
    this.lastTableBounceSide = currentSide;
  }

  // Helper method to get opponent ID
  private getOpponentId(): string | null {
    const playerIds = this.net.getPlayerIds();
    return playerIds.find((id) => id !== this.playerId) || null;
  }

  private getPlayerSide(playerId: string | null): "LEFT" | "RIGHT" | null {
    if (!playerId) return null;

    if (playerId === this.playerId) {
      return this.localPaddle.side;
    }

    return this.opponentPaddle.side;
  }

  private calculateMagnusSpin(
    paddleSpeed: number,
    paddleVelocityX: number,
  ): { spinY: number; applySpin: boolean } {
    let spinY = 0;
    let applySpin = false;

    if (paddleSpeed >= 28) {
      const clampedPaddleVelX = Math.max(-28, Math.min(28, paddleVelocityX));

      if (Math.abs(clampedPaddleVelX) > 26) {
        if (clampedPaddleVelX > 26) {
          spinY = ((clampedPaddleVelX - 26) / (28 - 26)) * 8;
        } else if (clampedPaddleVelX < -26) {
          spinY = ((clampedPaddleVelX + 26) / (-28 + 26)) * -8;
        }

        spinY = -spinY;
        applySpin = true;
        // this.ball.activateFireEffect();
      }
    }

    return { spinY, applySpin };
  }

  // ==================== Game loop methods =================
  public incrementTick(): void {
    this.currentTick++;
  }

  public updateVisuals(alpha: number): void {
    const pos = this.physics.paddle.getInterpolatedPos(alpha);
    this.localPaddle.updateVisual(pos as Vector3);

    this.updateVisualsOpponentPaddle();
    this.updateVisualsBall(alpha);
  }

  // ==================== Game state methods =================
  public pauseGame(): void {
    this.stopPaddleSync();
    this.stopBallSync();
  }

  public resumeGame(): void {
    this.startPaddleSync();
    this.startBallSync();
  }

  public resetRound(data: ballResetMessage): void {
    this.physics.reset(data, true);
    this.ball.deactivateFireEffect();

    this.gameState = GameState.WAITING_FOR_SERVE;
    this.isLocalServing = false;
    this.isPointEnded = false;
    this.TossBallUp = false;

    this.rollbackManager.reset();
    this.currentTick = 0;
    this.lastCollisionTick = 0;
    this.bufferOppPaddleStates = [];

    // Reset serve-specific tracking
    this.lastTableBounceSide = null;
    this.serverSideBounced = false;
  }

  // ==================== Serve methods =================
  public BallServe(): void {
    this.isLocalServing = true;

    const ballPos = this.ball.getMeshPosition();
    const serveVelocity = new Vector3(0, 2.5, 0);

    this.physics.setBallPosition(ballPos.x, ballPos.y, ballPos.z);
    this.physics.setBallFrozen(false);
    this.physics.setBallVelocity(
      serveVelocity.x,
      serveVelocity.y,
      serveVelocity.z,
    );

    this.lasthitPlayerId = this.playerId;

    const ballTossMessage: ballTossMessage = {
      position: {
        x: ballPos.x,
        y: ballPos.y,
        z: ballPos.z,
      },
      velocity: {
        x: serveVelocity.x,
        y: serveVelocity.y,
        z: serveVelocity.z,
      },
      playerId: this.playerId,
      tick: this.currentTick,
    };
    this.net.sendMessage("Ball:Toss", ballTossMessage);
  }

  // ==================== Main update methods =================
  public fixedUpdate(): void {
    if (!this.ball || !this.physics) return;

    const pointerX = this.scene.pointerX;
    const pointerY = this.scene.pointerY;
    if (pointerX === undefined || pointerY === undefined) return;

    const worldPos = this.screenToWorld(pointerX, pointerY);
    this.physics.paddle.setTarget(worldPos.x, worldPos.y, worldPos.z);

    // TEST:
    // this.updateLocalPaddle();

    this.physics.ball.setPosition("PREV");
    this.physics.Step();
    this.physics.ball.setPosition("CURR");
    this.rollbackManager?.recordState(this.currentTick);
    this.incrementTick();

    // console.log(`Current Tick: ${ this.currentTick } `);
    // const timeMin = Math.floor(this.currentTick / 60);
    // const timeSec = this.currentTick % 60;
    // console.log(`Time Elapsed: ${ timeMin }m ${ timeSec } s`);

    this.startPaddleSync();
    this.startBallSync();
  }
}
