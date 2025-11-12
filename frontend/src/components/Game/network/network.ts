import { Client, getStateCallbacks, Room } from "colyseus.js";
import { MatchPhase, MatchState } from "./GameState";
import { Match, MatchPlayer } from "@/types/game/game";
import { BallHitMessage, ballResetMessage, Vec3 } from "@/types/network";

interface NetworkEvents {
  "player:connected": (playerId: string, player: MatchPlayer) => void;
  "player:disconnected": (playerId: string) => void;
  "phase:changed": (phase: MatchPhase) => void;
  "winner:declared": (winnerId: string | null) => void;
  "countdown:updated": (countdown: number | null) => void;
  "game:paused": (data: { by: string; remainingPauseTime: number }) => void;
  "game:resumed": () => void;
  "game:pause-denied": (data: { reason: string }) => void;
  "game:pause-tick": (data: { by: string; remainingPauseTime: number }) => void;
  "game:ended": (data: { winnerId: string }) => void;
  "game:started": (data: { startTime: number }) => void;
  "opponent:paddle": (data: any) => void;
  "Ball:HitMessage": (data: BallHitMessage) => void;
  "game:StartAt": (startAt: number) => void;
  "Ball:Serve": (data: BallHitMessage) => void;
  "Ball:Reset": (data: ballResetMessage) => void;
  "score:update": (data: {
    scores: { playerId: string; newScore: number };
    pointBy: string;
  }) => void;
  "round:ended": (data: {
    pointBy: string;
    scores: Record<string, number>;
  }) => void;
  "serve:Turn": (serverId: string) => void;
  "lastHitPlayer:updated": (lastHitPlayer: string) => void;
  "serveState:changed": (serveState: "waiting_for_serve" | "in_play") => void;
}

export class Network {
  private client: Client;
  public room: Room<MatchState> | null = null;
  private roomIsReady: boolean = false;
  private match: Match | null = null;
  private readonly serverUrl: string;

  // Local state
  private players: Record<string, MatchPlayer> = {};
  private spectators: Record<string, any> = {};
  private winnerId: string | null = null;
  private phase: MatchPhase = "waiting";
  private countdown: number | null = null;
  private userId: string | null = null;

  public lastHitPlayer: string | null = null;
  // Events
  private eventListeners: Map<keyof NetworkEvents, Function[]> = new Map();

  constructor(serverUrl: string, match: Match) {
    this.serverUrl = serverUrl;
    this.client = new Client(serverUrl);
    this.match = match;

    // Set players
    this.players[match.opponent1.id] = match.opponent1;
    this.players[match.opponent2.id] = match.opponent2;
  }

  // Join
  async join(userId: string) {
    if (!this.match) throw new Error("Match data is required to join");
    try {
      this.room = await this.client.joinById<MatchState>(this.match?.id, {
        userId,
      });
      this.setupMatchListeners();
      this.roomIsReady = true;
      this.userId = userId;
      return this.room;
    } catch (err) {
      console.error("Join error:", err);
      throw err;
    }
  }

  // Setup Match listeners
  private setupMatchListeners() {
    if (!this.room) return;
    const $ = getStateCallbacks(this.room as any);

    // Players
    $(this.room.state as any).players.onAdd(
      (player: MatchPlayer, playerId: string) => {
        this.players[playerId] = {
          ...this.players[playerId],
          isConnected: player.isConnected,
          pauseRequests: player.pauseRequests,
          remainingPauseTime: player.remainingPauseTime,
        };
        this.emit("player:connected", playerId, this.players[playerId]);

        // Listen for isConnected changes
        $(player as any).listen("isConnected", (isConnected: boolean) => {
          if (this.players[playerId]) {
            this.players[playerId].isConnected = isConnected;
            if (isConnected)
              this.emit("player:connected", playerId, this.players[playerId]);
            else this.emit("player:disconnected", playerId);
          }
        });
      },
    );

    $(this.room.state as any).players.onChange(
      (_: MatchPlayer, playerId: string) => {
        if (this.players[playerId]) {
          // todo : wtf am i doing
          this.players[playerId].isConnected = false;
          this.players[playerId].remainingPauseTime = 0;
          this.players[playerId].pauseRequests = 0;
          this.emit("player:disconnected", playerId);
        }
      },
    );
    // P
    // Match States
    $(this.room.state as any).listen("phase", (phase: MatchPhase) => {
      this.phase = phase;
      this.emit("phase:changed", phase);
    });
    $(this.room.state as any).listen(
      "winnerId",
      (newWinnerId: string | null) => {
        this.winnerId = newWinnerId;
        this.emit("winner:declared", newWinnerId);
      },
    );
    $(this.room.state as any).listen("countdown", (countdown: number) => {
      this.countdown =
        this.room?.state.phase === "countdown" ? countdown : null;
      this.emit("countdown:updated", this.countdown);
    });
    $(this.room.state as any).listen("game:StartAt", (startAt: number) => {
      this.emit("game:StartAt", startAt);
    });
    $(this.room.state as any).listen(
      "lastHitPlayer",
      (lastHitPlayer: string) => {
        this.emit("lastHitPlayer:updated", lastHitPlayer);
      },
    );
    $(this.room.state as any).listen("serveState", (serveState: string) => {
      this.emit("serveState:changed", serveState);
    });
    // Listen to score changes properly
    $(this.room.state as any).scores.onChange(
      (score: number, playerId: string) => {
        console.log(`Score changed for player ${playerId}: ${score}`);

        // Emit score update event
        const allScores: Record<string, number> = {};
        this.room!.state.scores.forEach((s, pId) => {
          allScores[pId] = s;
        });

        this.emit("score:update", {
          scores: allScores,
          pointBy: playerId,
        });
      },
    );
    $(this.room.state as any).listen("currentServer", (currentServer) => {
      this.emit("serve:Turn", currentServer);
    });

    this.room.onMessage("game:paused", (data) => {
      this.emit("game:paused", data);
    });
    this.room.onMessage("game:pause-denied", (reason) => {
      this.emit("game:pause-denied", reason);
    });
    this.room.onMessage("game:resumed", () => {
      this.emit("game:resumed");
    });
    this.room.onMessage("game:resume-denied", (reason) => {
      this.emit("game:pause-denied", reason);
    });
    this.room.onMessage("game:pause-tick", (value) => {
      this.emit("game:pause-tick", value);
    });
    this.room.onMessage("game:give-up-denied", (reason) => {
      this.emit("game:pause-denied", reason);
    });
    this.room.onMessage("game:ended", (data) => {
      this.emit("game:ended", data);
    }); // todo : it seems that its working without adding this
    this.room.onMessage("game:started", (data) => {
      this.emit("game:started", data);
    });
    this.room.onMessage("opponent:paddle", (data) => {
      this.emit("opponent:paddle", data);
      // console.log("Opponent Paddle Data:", data);
    });
    this.room.onMessage("Ball:HitMessage", (data: BallHitMessage) => {
      console.log("Received Ball:HitMessage:", data);
      this.emit("Ball:HitMessage", data);
    });

    this.room.onMessage("Ball:Serve", (data: BallHitMessage) => {
      this.emit("Ball:Serve", data);
    });

    // move ball to serve position
    this.room.onMessage("Ball:Reset", (data: ballResetMessage) => {
      this.emit("Ball:Reset", data);
    });

    this.room.onMessage("round:ended", (data) => {
      this.emit("round:ended", data);
    });
  }

  // Send message to server
  sendMessage(type: string, data?: any) {
    if (!this.room) {
      console.warn("Cannot send message: not connected to room");
      return;
    }
    this.room.send(type, data);
  }

  // Getters // TODO If i didnt used those states, would be deleted altogether
  getRoom() {
    return this.room;
  }
  getPlayers() {
    return this.players;
  }

  // Get local player ID
  getPlayerId(): string | null {
    for (const playerId in this.players) {
      if (this.players[playerId].userId === this.userId) {
        return playerId;
      }
    }
    return null;
  }

  // debugging
  getPlayerIds(): string[] {
    if (!this.room || !this.room.state || !this.room.state.players) {
      console.warn("⚠️ Room or state not initialized yet");
      return [];
    }

    return Array.from(this.room.state.players.keys());
  }

  getSpectators() {
    return this.spectators;
  }
  getWinnerId() {
    return this.winnerId;
  }
  getPhase() {
    return this.phase;
  }
  getCountdown() {
    return this.countdown;
  }
  isConnected() {
    return this.room !== null;
  }
  isRoomReady() {
    return this.roomIsReady;
  }

  getLastHitPlayer() {
    return this.lastHitPlayer;
  }
  // Leave
  leave() {
    if (this.room) {
      this.room.leave();
      this.room = null;
      this.players = {};
      this.spectators = {};
      this.winnerId = null;
      this.phase = "waiting";
      this.countdown = null;
    }
  }

  // Event listeners
  on<K extends keyof NetworkEvents>(event: K, callback: NetworkEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  off<K extends keyof NetworkEvents>(event: K, callback: NetworkEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  private emit<K extends keyof NetworkEvents>(event: K, ...args: any[]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(...args));
    }
  }

  // Cleanup all listeners
  dispose() {
    this.leave();
    this.eventListeners.clear();
  }
}
