import { Client } from "colyseus";
import { MatchRoom } from "./MatchRoom";
import { ScoringHandler } from "./ScoringHandler";

export class MessageHandler {
  constructor(
    private room: MatchRoom,
    private scoringHandler: ScoringHandler,
  ) { }

  setupMessageHandlers() {
    // Player ready
    this.room.onMessage("player:ready", (client) => {
      this.handlePlayerReady(client);
    });

    // Player's paddle update
    this.room.onMessage("player:paddle", (client, message) => {
      this.handlePaddleUpdate(client, message);
    });

    // ball hit event from host
    this.room.onMessage("Ball:HitMessage", (client, message) => {
      this.handleBallHit(client, message);
    });

    // ball state update from host
    this.room.onMessage("Ball:state", (client, message) => {
      // // Get all player clients
      const playerClients = Array.from(this.room.clients.values()).filter(
        (c) => {
          const _c = c as any;
          return _c.matchPlayerId !== undefined; // Players have matchPlayerId set
        },
      );

      // Broadcast to spectators only (exclude all players)
      this.room.broadcast("Ball:state", message, { except: playerClients });
    });
    // ball serve event from host
    this.room.onMessage("Ball:Serve", (client, message) => {
      this.handleBallServe(client, message);
    });

    // Ball out event
    this.room.onMessage("Ball:Out", (client, message) => {
      this.scoringHandler.handlePointEnd(message);
    });

    // Ball toss event
    this.room.onMessage("Ball:Toss", (client, message) => {
      this.handleBallToss(client, message);
    });

    // Player give up
    this.room.onMessage("player:give-up", (client) => {
      this.handlePlayerGiveUp(client);
    });

    // Pause / Resume handling
    this.room.onMessage("game:pause", (client) => {
      this.room.handlePause(client);
    });

    // Game reset
    this.room.onMessage("game:reset", (client) => {
      this.handleGameReset(client);
    });
  }

  private handlePlayerReady(client: Client) {
    const _client = client as any;
    const player = this.room.state.players.get(_client.matchPlayerId);
    if (!player) return;

    player.isReady = true;

    // Start countdown if all ready
    if (this.room.allPlayersReady() && this.room.state.phase === "waiting") {
      this.room.startCountdown();
    }
  }

  private handlePaddleUpdate(client: Client, message: any) {
    const _client = client as any;
    const player = this.room.state.players.get(_client.matchPlayerId);
    // Broadcast to everyone except the sender
    this.room.broadcast(
      "opponent:paddle",
      {
        position: message.position,
        velocity: message.velocity,
        rotation: message.rotation,
        playerId: player?.id,
      },
      { except: client },
    );
  }

  private handleBallHit(client: Client, message: any) {
    this.room.state.lastHitPlayer = message.playerId;

    console.log(`Ball hit by player ${message.playerId}`);
    this.room.state.serveState = "in_play";
    this.room.broadcast("Ball:HitMessage", message, { except: client });
  }

  private handleBallServe(client: Client, message: any) {
    this.room.state.lastHitPlayer = message.playerId;
    this.room.state.serveState = "in_play";

    this.room.broadcast("Ball:Serve", message, { except: client });
  }

  private handleBallToss(client: Client, message: any) {
    // this.room.state.serveState = "in_play";
    this.room.broadcast("Ball:Toss", message, { except: client });
  }

  private handlePlayerGiveUp(client: Client) {
    const _client = client as any;
    const player = this.room.state.players.get(_client.matchPlayerId);
    if (!player) return;

    if (
      this.room.state.phase !== "playing" &&
      this.room.state.phase !== "paused"
    ) {
      this.room.send(client, "game:give-up-denied", {
        reason: "game not in playing or paused phase",
      });
      return;
    }

    // Clear intervals and timeouts
    this.room.clearCountdownInterval();
    this.room.clearPauseInterval();
    if (this.room.clock) this.room.clock.clear();

    this.room.state.phase = "ended";
    this.room.state.winnerId =
      Array.from(this.room.state.players.values()).find(
        (p) => p.id !== player.id,
      )?.id || null;

    this.room.broadcast("game:ended", { winnerId: this.room.state.winnerId });
  }

  private handleGameReset(client: Client) {
    if (this.room.state.phase !== "ended") return;

    // Reset state
    this.room.state.phase = "waiting";
    this.room.state.winnerId = null;
    this.room.state.countdown = 6;
    this.room.state.gameStartAt = 0;
    this.room.state.pauseBy = null;

    // Reset players
    this.room.state.players.forEach((player) => {
      player.isReady = false;
      player.pauseRequests = 0;
      player.remainingPauseTime = this.room.state.maxPauseTime;
      player.pauseStartTime = null;
      if (player.pauseTimeout) {
        clearTimeout(player.pauseTimeout);
        player.pauseTimeout = undefined;
      }
    });

    this.room.broadcast("game:reset");
  }
}
