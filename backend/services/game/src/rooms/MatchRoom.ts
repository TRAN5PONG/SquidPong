import { Room, Client } from "colyseus";
import { prisma } from "../lib/prisma";
import { MatchState, Player, Spectator } from "./MatchState";
import { MessageHandler } from "./MessageHandler";
import { ScoringHandler } from "./ScoringHandler";

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

  // Handlers
  private messageHandler!: MessageHandler;
  private scoringHandler!: ScoringHandler;

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
    this.state.totalPointsScored = match.matchSetting?.scoreLimit || 11;

    this.state.lastHitPlayer = null;
    this.state.currentServer = null;
    this.state.hostPlayerId = null;

    this.setMetadata({
      matchId: options.matchId,
      players: options.players,
      spectators: options.spectators,
    });

    // Initialize handlers
    this.scoringHandler = new ScoringHandler(this);
    this.messageHandler = new MessageHandler(this, this.scoringHandler);

    // Setup message listeners
    this.messageHandler.setupMessageHandlers();
  };

  onAuth(client: Client, options: any) {
    const _client = client as any;
    const { players, spectators } = this.metadata;
    if (players.includes(options.userId)) {
      _client.meta = { role: "player", userId: options.userId };
      return true;
    }

    if (options.spectate)
    {
      // auto assign spectator role
      _client.meta = { role: "spectator", userId: options.userId };
      return true;
    }
    return false;
  }

  onJoin = async (client: Client, options: any) => {
    const _client = client as any;


    // prints ID of the client that just joined
    console.log(
      `Client joined room ${this.roomId} with id ${client.sessionId}`,
    );
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
        this.state.scores.set(matchPlayer.id, 0);
      }

      if (matchPlayer.isHost) {
        this.state.hostPlayerId = matchPlayer.id;
        console.log(`🎮 Player ${matchPlayer.id} set as HOST from database`);
        this.broadcast("host:assigned", { hostPlayerId: matchPlayer.id });
      }

      if (this.state.players.size === 2 && !this.state.currentServer) {
        const playerIds = Array.from(this.state.players.keys());
        this.state.currentServer = playerIds[0];

        console.log(
          `=========================== Initial server set to player ${this.state.currentServer}`,
        );
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

        if (this.state.hostPlayerId === _client.matchPlayerId) {
          await this.migrateHost(_client.matchPlayerId);
        }
      }
    }
  };

  onDispose() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    console.log("Room disposed", this.roomId);
  }

  // --- Helpers ---
  allPlayersReady(): boolean {
    if (this.state.players.size < 2) return false;
    return Array.from(this.state.players.values()).every((p) => p.isReady);
  }

  startCountdown() {
    this.state.phase = "countdown";
    this.state.countdown = 6;

    this.countdownInterval = setInterval(() => {
      this.state.countdown--;
      if (this.state.countdown <= 0) {
        this.startGame();
      }
    }, 1000);
  }

  startPauseInterval(player: Player) {
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

  stopPauseInterval() {
    if (this.pauseInterval) {
      clearInterval(this.pauseInterval);
      this.pauseInterval = undefined;
    }
  }

  startGame() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.state.gameStartAt = Date.now();
    this.state.phase = "playing";
    this.broadcast("game:started", { startTime: this.state.gameStartAt });
  }

  handlePause(client: Client) {
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
        player.remainingPauseTime * 1000,
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
          (Date.now() - player.pauseStartTime) / 1000,
        );
        player.remainingPauseTime = Math.max(
          player.remainingPauseTime - pausedDuration,
          0,
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

  forceResume(player: Player) {
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

  getCountdownInterval() {
    return this.countdownInterval;
  }

  clearCountdownInterval() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
  }

  getPauseInterval() {
    return this.pauseInterval;
  }

  clearPauseInterval() {
    if (this.pauseInterval) {
      clearInterval(this.pauseInterval);
      this.pauseInterval = undefined;
    }
  }

  private migrateHost(disconnectedHostId: string) {
    const remainingPlayers = Array.from(this.state.players.values()).filter(
      (p) => p.isConnected && p.id !== disconnectedHostId,
    );

    if (remainingPlayers.length > 0) {
      const newHostId = remainingPlayers[0].id;
      this.state.hostPlayerId = newHostId;

      console.log(`🔄 HOST MIGRATED: ${disconnectedHostId} -> ${newHostId}`);

      this.broadcast("host:migrated", {
        oldHostId: disconnectedHostId,
        newHostId: newHostId,
      });
    } else {
      this.state.hostPlayerId = null;
      console.log(`⚠️ No remaining players to assign as host`);
    }
  }
}
