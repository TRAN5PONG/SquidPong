// debug paddle
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Network } from "../network/network";
import { Paddle } from "../entities/Paddle/GamePaddle";
import { Ball } from "../entities/Ball";
import { Physics } from "../physics";
import { RollbackManager } from "./RollbackManager";
import { BallHitMessage, ballResetMessage, PaddleState } from "@/types/network";
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

  // Bounce Logic
  private lastTableBounceSide: "LEFT" | "RIGHT" | null = null;
  private hasBouncedOnce: boolean = false;
  private lasthitPlayerId: string | null = null;
  private serverSideBounced: boolean = false;

  private bufferOppPaddleStates: Array<{ time: number; data: PaddleState }> =
    [];
  private readonly MAX_SIZE: number = 6;

  // TEST: Mouse tracking
  private clampedX: number = 0;
  private clampedZ: number = 0;
  private paddlePlane: Plane | null = null;

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

    // For now, right paddle always serves first just for testing
    this.MyTurnToServe = this.localPaddle.side === "RIGHT" ? true : false;

    // Listen for opponent paddle updates
    this.net.on("opponent:paddle", (data) => {
      this.onOpponentPaddleState(data);
    });
    // Listen for ball hit updates
    this.net.on("Ball:HitMessage", (data: BallHitMessage) => {
      this.physics.setLastHitBy(data.playerId);
      this.lasthitPlayerId = data.playerId;

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
      this.physics.setLastHitBy(data.playerId);
      this.lasthitPlayerId = data.playerId;
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

    // Listen for ball reset (new round)
    this.net.on("Ball:Reset", (data: ballResetMessage) => {
      this.resetRound(data);
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

      this.physics.setLastHitBy(this.playerId);
      this.lasthitPlayerId = this.playerId;
      this.lastTableBounceSide = null;
      this.hasBouncedOnce = false;
      this.lastCollisionTick = this.currentTick;

      let ballVel: Vector3;
      let isServe = false; // Track if this is a serve

      if (this.gameState === GameState.WAITING_FOR_SERVE) {
        // === SERVE HIT ===
        isServe = true; // Mark as serve
        ballVel = this.physics.calculateServeVelocity(
          ball.translation(),
          paddle.translation(),
        );
        this.physics.setBallSpin(0, 0, 0);
        this.physics.setApplySpin(false);

        // Update game state
        this.gameState = GameState.IN_PLAY;
      } else {
        // === RALLY HIT ===
        const spinCalc = this.calculateMagnusSpin(
          paddleSpeed,
          paddleVelocity.x,
          this.localPaddle.side === "RIGHT" ? -1 : 1,
        );
        this.physics.setBallSpin(0, spinCalc.spinY, 0);
        this.physics.setApplySpin(spinCalc.applySpin);

        ballVel = this.physics.calculateTargetZYVelocity(
          ball.translation(),
          paddle.translation(),
        );
      }

      const currentVel = ball.linvel();
      const mass = ball.mass();

      const impulse = new Vector3(
        (ballVel.x - currentVel.x) * mass,
        (ballVel.y - currentVel.y) * mass,
        (ballVel.z - currentVel.z) * mass,
      );
      this.physics.ball.body.applyImpulse(impulse, true);

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
      };

      // Send correct message type based on whether it's a serve or rally hit
      if (isServe) {
        console.log("Sending Ball:Serve message");
        this.net.sendMessage("Ball:Serve", hitMsg);
      } else {
        console.log("Sending Ball:HitMessage");
        this.net.sendMessage("Ball:HitMessage", hitMsg);
      }
    };
    // Ball with floor collision callback
    this.physics.onBallFloorCollision = (ball, floor) => {
      // Could add sound or effects here
      if (this.shouldISendThisEvent(ball)) {
        this.ballOut();
      }
    };
    // Ball with net collision callback
    this.physics.onBallNetCollision = (ball, net) => {
      // Could add sound or effects here
      if (this.shouldISendThisEvent(ball)) {
        this.ballOut();
      }
    };
    // ball with Table collision callback
    this.physics.onBallTableCollision = (ball, table) => {
      // Could add sound or effects here
      if (this.shouldISendThisEvent(ball)) {
        this.handleTableBounce(ball);
      }
    };
  }

  private shouldISendThisEvent(ball: any): boolean {
    const lastHitById = this.lasthitPlayerId;
    const myPlayerId = this.playerId;

    console.log(`🔍 Last hit by: ${lastHitById}, My ID: ${myPlayerId}`);

    return lastHitById === myPlayerId;
  }
  private ballOut(): void {
    const Message = {
      side: this.localPaddle.side === "RIGHT" ? "player1" : "player2",
    };
    // console.log(`Ball out! Point for ${Message} `);
    this.net.sendMessage("Ball:Out", Message);
  }

  private handleTableBounce(ball: any): void {
    const ballZ = ball.translation().z;
    const currentSide: "LEFT" | "RIGHT" = ballZ > 0 ? "RIGHT" : "LEFT";

    // Get the side of the player who last hit the ball
    const lastHitterSide = this.getPlayerSide(this.lasthitPlayerId);

    // SERVE PHASE: Ball must bounce on server's side first, then opponent's side
    if (!this.serverSideBounced) {
      // First bounce during serve
      const serverSide = this.MyTurnToServe
        ? this.localPaddle.side
        : this.opponentPaddle.side;

      if (currentSide === serverSide) {
        // ✅ Valid first bounce on server's side
        this.serverSideBounced = true;
        this.lastTableBounceSide = currentSide;
        console.log(`✅ Serve: Ball bounced on server's side (${currentSide})`);
      } else {
        // ❌ Serve fault - ball didn't bounce on server's side first
        console.log(
          `❌ Serve fault - ball bounced on wrong side (${currentSide} instead of ${serverSide})`,
        );
        this.serveFault();
        return;
      }
    }
    // RALLY PHASE: After the serve is complete (ball has bounced on both sides)
    else if (this.lastTableBounceSide !== null) {
      // During rally, check if ball bounced on hitter's own side (FAULT)
      if (lastHitterSide && currentSide === lastHitterSide) {
        console.log(
          `❌ Fault - Player hit ball and it bounced on their own side (${currentSide})`,
        );
        this.ballOut();
        return;
      }

      // Check for double bounce on same side
      if (this.lastTableBounceSide === currentSide) {
        console.log(`❌ Double bounce on ${currentSide} side`);
        this.ballOut();
        return;
      }

      // Valid bounce on opponent's side
      this.lastTableBounceSide = currentSide;
      console.log(`✅ Valid bounce on ${currentSide} side`);
    }
    // SERVE COMPLETION: Second bounce (must be on opponent's side)
    else {
      const serverSide = this.MyTurnToServe
        ? this.localPaddle.side
        : this.opponentPaddle.side;
      const opponentSide = serverSide === "LEFT" ? "RIGHT" : "LEFT";

      if (currentSide === opponentSide) {
        // ✅ Valid second bounce - serve is complete, rally begins
        this.lastTableBounceSide = currentSide;
        console.log(
          `✅ Serve complete: Ball bounced on opponent's side (${currentSide})`,
        );
      } else {
        // ❌ Serve fault - ball bounced on server's side twice
        console.log(`❌ Serve fault - ball bounced on server's side twice`);
        this.serveFault();
        return;
      }
    }
  }

  // Helper to determine which side a player is on based on their ID
  private getPlayerSide(playerId: string | null): "LEFT" | "RIGHT" | null {
    if (!playerId) return null;

    // Check if this player ID matches the local player
    if (playerId === this.playerId) {
      return this.localPaddle.side;
    }

    // Otherwise it's the opponent
    return this.opponentPaddle.side;
  }
  private serveFault(): void {
    const serverId = this.MyTurnToServe ? this.playerId : null;
    if (serverId) {
      console.log(`⚠️ Serve fault by player ${serverId}`);
      this.net.sendMessage("Serve:Failed", { playerId: serverId });
    }
  }
  // Helper method to get player's side
  private getPlayerSide(playerId: string | null): "LEFT" | "RIGHT" | null {
    if (!playerId) return null;

    // If it's my ID, return my paddle side
    if (playerId === this.playerId) {
      return this.localPaddle.side;
    }

    // Otherwise it's opponent's side
    return this.opponentPaddle.side;
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

  public resetRound(data: ballResetMessage): void {
    this.physics.setBallFrozen(true);
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
    this.physics.setLastHitBy(data.lastHitPlayer);

    // Reset rollback manager
    this.rollbackManager.reset();

    // Reset game state
    this.gameState = GameState.WAITING_FOR_SERVE;
    this.currentTick = 0;
    this.lastCollisionTick = 0;

    // Clear opponent paddle buffer
    this.bufferOppPaddleStates = [];

    // reset bounce logic
    this.lastTableBounceSide = null;
    this.hasBouncedOnce = false;
    this.serverSideBounced = false;
    this.lasthitPlayerId = null;

    this.MyTurnToServe = data.nextServerId === this.net.getPlayerId();
    // TODO: start Timout for serve
    // if (this.MyTurnToServe)
  }

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

    this.lasthitPlayerId = this.playerId;
    // this.physics.setLastHitBy(this.playerId);
    // Sync serve to opponent
    const serveMsg: BallHitMessage = {
      position: { x: ballPos.x, y: ballPos.y, z: ballPos.z },
      velocity: { x: serveVelocity.x, y: serveVelocity.y, z: serveVelocity.z },
      spin: { x: 0, y: 0, z: 0 },
      applySpin: false,
      tick: this.currentTick,
      playerId: this.net.getPlayerId()!,
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

    // console.log(`Current Tick: ${ this.currentTick } `);
    // const timeMin = Math.floor(this.currentTick / 60);
    // const timeSec = this.currentTick % 60;
    // console.log(`Time Elapsed: ${ timeMin }m ${ timeSec } s`);

    this.startPaddleSync();
  }
}
