import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";
import { prisma } from "../lib/prisma";

// --- Game State ---
class Paddle extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") z = 0;
  @type("number") velX = 0;
  @type("number") velY = 0;
  @type("number") velZ = 0;
  @type("number") rotationZ = 0;
}

class Player extends Schema {
  @type("string") id!: string; // MatchPlayer.id
  @type("boolean") isReady = false;
  @type("boolean") isConnected = true;
  @type("number") pauseRequests = 0;
  @type("number") remainingPauseTime!: number;
  @type(Paddle) paddle = new Paddle();
  pauseStartTime: number | null = null;
  pauseTimeout?: NodeJS.Timeout;
}

class Spectator extends Schema {
  @type("string") id!: string;
  @type("string") username!: string;
}

class MatchState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Spectator }) spectators = new MapSchema<Spectator>();
  @type("string") phase:
    | "waiting"
    | "countdown"
    | "playing"
    | "paused"
    | "ended" = "waiting";
  @type("number") countdown = 6;
  @type("string") winnerId: string | null = null;
  // Game start time
  @type("number") gameStartAt = 0;
  // Pause logic
  @type("number") maxPauseTime!: number;
  @type("string") pauseBy: string | null = null;
}

// --- Room ---
interface MatchRoomOptions {
  matchId: string;
  roomId: string;
  players: string[]; // userIds
  spectators: string[];
}

export class MatchRoom extends Room<MatchState> {
  maxClients = 10;
  autoDispose = false; //TODO: i need to handle disposal myself
  // Intervals
  private countdownInterval?: NodeJS.Timeout;
  private pauseInterval?: NodeJS.Timeout;

  onCreate = async (options: MatchRoomOptions) => {
    // Get/create consistent roomId
    this.roomId = options.roomId;

    const match = await prisma.match.findUnique({
      where: { id: options.matchId },
      include: { matchSetting: true },
    });
    if (!match) throw new Error("Match not found");

    this.state = new MatchState();
    this.state.maxPauseTime = match.matchSetting?.pauseTime || 3;
    this.setMetadata({
      matchId: options.matchId,
      players: options.players,
      spectators: options.spectators,
    });

    // Player ready
    this.onMessage("player:ready", (client) => {
      const _client = client as any;
      const player = this.state.players.get(_client.matchPlayerId);
      if (!player) return;

      player.isReady = true;

      // Start countdown if all ready
      if (this.allPlayersReady() && this.state.phase === "waiting") {
        this.startCountdown();
      }
    });

    // Player's paddle update
    this.onMessage("player:paddle", (client, message) => {
      const _client = client as any;
      const player = this.state.players.get(_client.matchPlayerId);
      if (!player) return;

      // Send send just the opponent paddle to each player
      for (const [id, other] of this.state.players) {
        if (id !== player.id) {
          const otherPlayer = this.clients.find(c => (c as any).matchPlayerId === id);
          if (otherPlayer) {
            otherPlayer.send("opponent:paddle", {
              position: message.position,
              velocity: message.velocity,
              rotation: message.rotation,
            });
          }
        }
      }
    });
    // Player give up
    this.onMessage("player:give-up", (client) => {
      const _client = client as any;
      const player = this.state.players.get(_client.matchPlayerId);
      if (!player) return;

      if (this.state.phase !== "playing" && this.state.phase !== "paused") {
        this.send(client, "game:give-up-denied", {
          reason: "game not in playing or paused phase",
        });
        return;
      }

      // Clear intervals and timeouts
      if (this.countdownInterval) clearInterval(this.countdownInterval);
      if (this.pauseInterval) clearInterval(this.pauseInterval);
      if (this.clock) this.clock.clear();

      this.state.phase = "ended";
      this.state.winnerId =
        Array.from(this.state.players.values()).find((p) => p.id !== player.id)
          ?.id || null;

      this.broadcast("game:ended", { winnerId: this.state.winnerId });
    });
    // Pause / Resume handling
    this.onMessage("game:pause", (client) => this.handlePause(client));
    // Game reset
    this.onMessage("game:reset", (client) => {
      if (this.state.phase !== "ended") return;

      // Reset state
      this.state.phase = "waiting";
      this.state.winnerId = null;
      this.state.countdown = 6;
      this.state.gameStartAt = 0;
      this.state.pauseBy = null;

      // Reset players
      this.state.players.forEach((player) => {
        player.isReady = false;
        player.pauseRequests = 0;
        player.remainingPauseTime = this.state.maxPauseTime;
        player.pauseStartTime = null;
        if (player.pauseTimeout) {
          clearTimeout(player.pauseTimeout);
          player.pauseTimeout = undefined;
        }
      });

      this.broadcast("game:reset");
    });
  };

  onAuth(client: Client, options: any) {
    const _client = client as any;
    const { players, spectators } = this.metadata;

    if (players.includes(options.userId)) {
      _client.meta = { role: "player", userId: options.userId };
      return true;
    }

    if (spectators.includes(options.userId)) {
      _client.meta = { role: "spectator", userId: options.userId };
      return true;
    }

    return false;
  }

  onJoin = async (client: Client, options: any) => {
    const _client = client as any;

    if (_client.meta.role === "player") {
      // check if player already in room
      const matchPlayer = await prisma.matchPlayer.findFirst({
        where: {
          userId: options.userId,
          OR: [
            {
              matchAsOpponent1: { status: { in: ["WAITING", "IN_PROGRESS"] } },
            },
            {
              matchAsOpponent2: { status: { in: ["WAITING", "IN_PROGRESS"] } },
            },
          ],
        },
      });

      if (!matchPlayer) {
        console.error(`No match player found for userId ${options.userId}`);
        client.leave();
        return;
      }

      _client.matchPlayerId = matchPlayer.id;
      let player = this.state.players.get(matchPlayer.id);

      if (player) {
        player.isConnected = true;
      } else {
        player = new Player();
        player.id = matchPlayer.id;
        player.isConnected = true;
        player.remainingPauseTime = this.state.maxPauseTime;

        this.state.players.set(matchPlayer.id, player);
      }
    } else {
      const spectator = new Spectator();
      spectator.id = _client.sessionId;
      spectator.username = options.username || "unknown";
      this.state.spectators.set(client.sessionId, spectator);
      console.log(`Spectator ${spectator.id} joined room ${this.roomId}`);
    }
  };

  onLeave = async (client: Client, consented: boolean) => {
    const _client = client as any;

    if (_client.matchPlayerId) {
      const player = this.state.players.get(_client.matchPlayerId);

      if (player) {
        if (player.pauseTimeout) {
          clearTimeout(player.pauseTimeout);
        }
        player.isConnected = false;
      }
    }
  };

  onDispose() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    console.log("Room disposed", this.roomId);
  }

  // --- Helpers ---
  private allPlayersReady(): boolean {
    if (this.state.players.size < 2) return false;
    return Array.from(this.state.players.values()).every((p) => p.isReady);
  }
  private startCountdown() {
    this.state.phase = "countdown";
    this.state.countdown = 6;

    this.countdownInterval = setInterval(() => {
      this.state.countdown--;
      if (this.state.countdown <= 0) {
        this.startGame();
      }
    }, 1000);
  }
  private startPauseInterval(player: Player) {
    this.stopPauseInterval(); // Prevent duplicates

    this.pauseInterval = setInterval(() => {
      if (this.state.phase !== "paused" || !player.pauseStartTime) {
        this.stopPauseInterval();
        return;
      }

      const elapsed = Math.floor((Date.now() - player.pauseStartTime) / 1000);
      const remaining = Math.max(player.remainingPauseTime - elapsed, 0);

      this.broadcast("game:pause-tick", {
        by: player.id,
        remainingPauseTime: remaining,
      });

      if (remaining <= 0) {
        this.forceResume(player);
      }
    }, 1000);
  }
  private stopPauseInterval() {
    if (this.pauseInterval) {
      clearInterval(this.pauseInterval);
      this.pauseInterval = undefined;
    }
  }
  private startGame() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.state.gameStartAt = Date.now();
    this.state.phase = "playing";
    this.broadcast("game:started", { startTime: this.state.gameStartAt });
  }
  private handlePause(client: Client) {
    const _client = client as any;

    const player = this.state.players.get(_client.matchPlayerId);

    if (!player) {
      this.send(client, "game:pause-denied", { reason: "not a player" });
      return;
    }

    if (this.state.phase !== "playing" && this.state.phase !== "paused") {
      this.send(client, "game:pause-denied", {
        reason: "game not in playing or paused phase",
      });
      return;
    }

    if (this.state.phase === "playing") {
      if (player.remainingPauseTime <= 0 || player.pauseRequests >= 3) {
        this.send(client, "game:pause-denied", {
          reason: "no remaining pause time or max pause requests reached",
        });
        return;
      }

      this.state.phase = "paused";
      this.state.pauseBy = player.id;
      player.pauseRequests += 1;
      player.pauseStartTime = Date.now();

      player.pauseTimeout = setTimeout(
        () => this.forceResume(player),
        player.remainingPauseTime * 1000
      );

      this.startPauseInterval(player);
      this.broadcast("game:paused", {
        by: player.id,
        remainingPauseTime: player.remainingPauseTime,
      });
      return;
    }

    if (this.state.phase === "paused") {
      if (this.state.pauseBy !== player.id) {
        this.send(client, "game:resume-denied", {
          reason: "only the player who paused can resume",
        });
        return;
      }

      if (player.pauseStartTime) {
        const pausedDuration = Math.floor(
          (Date.now() - player.pauseStartTime) / 1000
        );
        player.remainingPauseTime = Math.max(
          player.remainingPauseTime - pausedDuration,
          0
        );
        player.pauseStartTime = null;
      }

      if (player.pauseTimeout) {
        clearTimeout(player.pauseTimeout);
        player.pauseTimeout = undefined;
      }

      this.stopPauseInterval();
      this.state.phase = "playing";
      this.state.pauseBy = null;
      this.broadcast("game:resumed", {
        by: player.id,
        remainingPauseTime: player.remainingPauseTime,
      });
    }
  }
  private forceResume(player: Player) {
    if (this.state.phase === "paused" && player.pauseStartTime) {
      player.remainingPauseTime = 0;
      player.pauseStartTime = null;

      if (player.pauseTimeout) clearTimeout(player.pauseTimeout);
      player.pauseTimeout = undefined;

      // Stop pause ticks
      this.stopPauseInterval();

      this.state.phase = "playing";
      this.state.pauseBy = null;

      this.broadcast("game:resumed", { by: "system", remainingPauseTime: 0 });
    }
  }
}
