import { Client, Room } from "colyseus.js";
import { GameState } from "../network/GameState";
import { GameController } from "../components/Game/controllers/gameController";
import { Vec3, BallHitMessage } from "@/types/network";
import { Vector3 } from "@babylonjs/core";
import { ServeBall } from "../components/Game/controllers/gameController";

export enum BallSyncResult {
  ROLLBACK_NEEDED,
  APPLY_IMMEDIATELY,
  FUTURE_TICK_WARNING
}

export interface BallSyncInfo {
  result: BallSyncResult;
  receivedTick: number;
  currentTick: number;
  tickDifference: number;
}

export class EntryPoint {
  client: Client;
  room!: Room<GameState>;
  playerSide: number = -1;
  gameController!: GameController;

  // Network timing
  private networkLatency: number = 0;
  private lastPingTime: number = 0;

  constructor() {
    const serverUrl = this.getServerUrl();
    this.client = new Client(serverUrl);
  }

  async joinRoom(roomName = "game"): Promise<number> {
    try {
      this.room = await this.client.joinOrCreate<GameState>(roomName);
      console.log("✅ Joined room:", roomName);

      return new Promise((resolve) => {
        this.setupMessageHandlers(resolve);
        this.setupConnectionHandlers();
      });

    } catch (error) {
      console.error("❌ Error joining room:", error);
      throw error;
    }
  }

  private setupMessageHandlers(resolve: (value: number) => void): void {
    let resolved = false;

    // Handle ball hit messages with rollback logic
    this.room.onMessage("BallState", (msg: BallHitMessage) => {
      this.handleBallHit(msg);
    });

    // Handle player side assignment
    this.room.onMessage("playerSide", (msg: { side: number }) => {
      if (!resolved) {
        this.playerSide = msg.side;
        resolved = true;
        console.log("Got player side:", this.playerSide);
        resolve(this.playerSide);
      }
    });

    // Handle game resets
    this.room.onMessage("resetGame", (data: { tick: number, resetBy: string }) => {
      this.handleGameReset(data);
    });

    // Handle ball following during serve
    this.room.onMessage("BallPreServe", (msg: { position: Vec3, isServing: boolean, servingPlayer: string }) => {
      this.handleBallFollow(msg);
    });

    // Handle ball serve
    this.room.onMessage("BallServed", (msg: { velocity: Vec3, position: Vec3, tick: number, serverId: string }) => {
      this.handleBallServed(msg);
    });
  }

  private setupConnectionHandlers(): void {
    this.room.onLeave((code) => {
      console.warn("❌ Disconnected from server. Code:", code);
    });

    this.room.onError((code, message) => {
      console.error("❌ Server error:", code, message);
    });
  }

  private handleBallHit(msg: BallHitMessage): void {
    const { position, velocity, spin, applySpin, tick, hitterId } = msg;

    if (hitterId === this.room.sessionId) {
      return;
    }

    const syncInfo = this.analyzeBallSync(tick);
    console.log(`Received ball hit from ${hitterId}:`, syncInfo);

    switch (syncInfo.result) {
      case BallSyncResult.ROLLBACK_NEEDED:
        this.performRollback(tick, position, velocity, spin);
        break;

      case BallSyncResult.APPLY_IMMEDIATELY:
        this.applyBallStateImmediately(position, velocity, spin, applySpin);
        break;

      case BallSyncResult.FUTURE_TICK_WARNING:
        console.warn(`Future tick received - applying anyway`);
        this.applyBallStateImmediately(position, velocity, spin, applySpin);
        break;
    }
  }

  private analyzeBallSync(receivedTick: number): BallSyncInfo {
    const currentTick = this.gameController.getCurrentTick();
    const tickDifference = currentTick - receivedTick;

    let result: BallSyncResult;
    if (receivedTick < currentTick) {
      result = BallSyncResult.ROLLBACK_NEEDED;
    } else if (receivedTick === currentTick) {
      result = BallSyncResult.APPLY_IMMEDIATELY;
    } else {
      result = BallSyncResult.FUTURE_TICK_WARNING;
    }

    return {
      result,
      receivedTick,
      currentTick,
      tickDifference
    };
  }

  private performRollback(tick: number, position: Vec3, velocity: Vec3, spin?: Vec3): void {
    console.log(`🔄 Performing rollback to tick ${tick}`);

    try {
      this.gameController.rollbackBall(tick, position, velocity, spin);
      console.log(`✅ Rollback completed successfully`);
    } catch (error) {
      console.error("❌ Rollback failed:", error);
      // Fallback to immediate application
      this.applyBallStateImmediately(position, velocity, spin, true);
    }
  }

  private applyBallStateImmediately(position: Vec3, velocity: Vec3, spin?: Vec3, applySpin: boolean = true): void {
    console.log(`⚡ Applying ball state immediately`);

    if (!this.gameController.physics) {
      console.warn("Physics not available for immediate ball state application");
      return;
    }

    this.gameController.physics.setBallPosition(position.x, position.y, position.z);
    this.gameController.physics.setBallVelocity(velocity.x, velocity.y, velocity.z);

    if (spin) {
      this.gameController.physics.setBallSpin(spin.x, spin.y, spin.z);
      this.gameController.physics.setApplySpin(applySpin);
    }
  }

  private handleGameReset(data: { tick: number, resetBy: string }): void {
    // Don't reset if we initiated the reset
    if (data.resetBy !== this.room.sessionId) {
      console.log(`🔄 Game reset by opponent (${data.resetBy})`);
      this.gameController.resetGame();
    }
  }

  private handleBallFollow(msg: { position: Vec3, isServing: boolean, servingPlayer: string }): void {
    console.log(`🏓 Ball following opponent paddle`);
    if (!this.gameController)
      return;
    this.gameController.setOpponentServePosition(msg.position);
  }

  private handleBallServed(msg: { velocity: Vec3, position: Vec3, tick: number, serverId: string }): void {
    if (msg.serverId !== this.room.sessionId) {
      console.log(`🚀 Opponent served the ball at tick ${msg.tick}`);

      // Set ball to IN_PLAY state
      this.gameController.serveState = ServeBall.IN_PLAY;

      // Apply the serve
      if (this.gameController.physics) {
        this.gameController.physics.setBallFrozen(false);
        this.gameController.physics.setBallPosition(msg.position.x, msg.position.y, msg.position.z);
        this.gameController.physics.setBallVelocity(msg.velocity.x, msg.velocity.y, msg.velocity.z);
      }

      // Sync tick if needed
      const currentTick = this.gameController.getCurrentTick();
      if (msg.tick !== currentTick) {
        console.log(`🔄 Syncing tick from ${currentTick} to ${msg.tick}`);
        this.gameController.resetTick(msg.tick);
      }
    }
  }

  // Public methods
  SendPaddlePosition(position: Vec3, rotation: Vec3, velocity: Vec3): void {
    if (this.room) {
      const paddleState = { position, rotation, velocity };
      this.room.send("PaddleState", paddleState);
    } else {
      console.warn("⚠️ Tried to send PaddleState but room is not connected");
    }
  }

  SendBallHit(hit: BallHitMessage): void {
    if (this.room) {
      console.log(`📤 Sending ball hit at tick ${hit.tick}`);
      this.room.send("BallHit", hit);
    } else {
      console.warn("⚠️ Tried to send BallHit but room is not connected");
    }
  }

  // Connection management
  private getServerUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '3000';

    console.log(`🔌 Connecting to server at ${protocol}//${host}:${port}`);
    return `${protocol}//${host}:${port}`;
  }

  getPlayerIds(): string[] {
    if (!this.room || !this.room.state || !this.room.state.players) {
      console.warn("⚠️ Room or state not initialized yet");
      return [];
    }

    return Array.from(this.room.state.players.keys());
  }

  setGameController(controller: GameController): void {
    this.gameController = controller;
  }

  onServerUpdate(callback: (state: GameState) => void): void {
    this.room.onStateChange(callback);
  }

  // Utility methods for debugging
  debugNetworkState(): void {
    console.log("🔍 Network Debug Info:", {
      connected: !!this.room,
      sessionId: this.room?.sessionId,
      playerSide: this.playerSide,
      latency: this.networkLatency,
      playerCount: this.getPlayerIds().length
    });
  }

  getCurrentGameTick(): number {
    return this.gameController?.getCurrentTick() || 0;
  }

  isConnected(): boolean {
    return !!this.room && this.room.connection.isOpen;
  }

  disconnect(): void {
    if (this.room) {
      console.log("👋 Disconnecting from room");
      this.room.leave();
    }
  }
}