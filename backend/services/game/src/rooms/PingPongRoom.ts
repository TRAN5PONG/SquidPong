import { Room, Client, AuthContext } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";
import { prisma } from "../lib/prisma";
import jwt from "jsonwebtoken";

// Game State
class Player extends Schema {
  @type("string") id!: string;
  @type("string") username!: string;
  @type("string") avatarUrl!: string;
  @type("boolean") isReady = false;
  @type("boolean") isHost = false;
  @type("boolean") isWinner = false;
  @type("boolean") isResigned = false;
  @type("boolean") isConnected = true;

  // Player metadata
  @type("string") characterId!: string;
  @type("string") paddleId!: string;
  @type("string") rankDivision!: string;
  @type("string") rankTier!: string;

  // Game-specific properties
  @type("number") x = 0;
  @type("number") y = 0;
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
  @type("number") countdown = 6; // seconds
  @type("string") winnerId: string | null = null;
}

// Game Room
interface MatchRoomOptions {
  matchId: string;
  players: string[]; // userIds of players
  spectators: string[]; // userIds of spectators
}
export class MatchRoom extends Room<MatchState> {
  maxClients = 10; // 2 players + 8 spectators
  private countdownInterval?: NodeJS.Timeout;

  onCreate(options: MatchRoomOptions) {
    console.log("new Room created!", this.roomId);

    this.state = new MatchState();
    this.setMetadata({
      matchId: options.matchId,
      players: options.players,
      spectators: options.spectators,
    });

    // Player messages
    this.onMessage("player:ready", (client, message) => {
      // const player = this.state.players.get(client.sessionId);
      // if (player) {
      //   player.isReady = message.isReady;
      //   console.log(`Player ${player.id} isReady: ${player.isReady}`);
      // }
      // if (this.allPlayersReady() && this.state.phase === "waiting") {
      //   this.startCountdown();
      // }
    });
    // on pause request
    this.onMessage("game:pause", (client) => {
      if (this.state.phase === "playing") {
        this.state.phase = "paused";
        console.log("Game paused");
        this.broadcast("game:paused");
      }
    });
  }

  onAuth(client: Client, options: any) {
    const _client = client as any;
    const { players, spectators } = this.metadata;

    if (players.includes(options.userId)) {
      _client.meta = { role: "player", userId: options.userId };
      return true; // allow player
    }

    if (spectators.includes(options.userId)) {
      _client.meta = { role: "spectator", userId: options.userId };
      return true; // allow spectator
    }

    return false; // deny access
  }

  onJoin = async (client: Client, options: any) => {
    const _client = client as any;

    if (_client.meta.role === "player") {
      const matchPlayer = await prisma.matchPlayer.findFirst({
        where: {
          userId: options.userId,
        },
      });
      if (!matchPlayer) {
        console.error(`No match player found for userId ${options.userId}`);
        client.leave();
        return;
      }

      let player = this.state.players.get(matchPlayer.userId!);
      if (!player) {
        const player = new Player();
        player.id = matchPlayer.id;
        player.username = matchPlayer.username;
        player.avatarUrl = matchPlayer.avatarUrl || "";
        player.isHost = matchPlayer.isHost;
        player.isResigned = matchPlayer.isResigned;
        player.isWinner = matchPlayer.isWinner;
        player.characterId = matchPlayer.characterId;
        player.paddleId = matchPlayer.paddleId;
        player.rankDivision = matchPlayer.rankDivision;
        player.rankTier = matchPlayer.rankTier;

        this.state.players.set(matchPlayer.userId!, player);
        console.log(`Player ${player.id} joined room ${this.roomId}`);
      } else {
        player.isConnected = true;
        console.log(`Player ${player.id} re-joined room ${this.roomId}`);
      }
    } else {
      const spectator = new Spectator();
      spectator.id = _client.sessionId;
      spectator.username = options.username || "unknown";
      this.state.spectators.set(client.sessionId, spectator);
      console.log(`Spectator ${spectator.id} joined room ${this.roomId}`);
    }
  };

  onLeave(client: Client, consented: boolean) {
    const _client = client as any;
    const player = this.state.players.get(_client.meta.userId);
    if (player) {
      player.isConnected = false;
    }
  }

  onDispose() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    console.log("Room disposed", this.roomId);
  }

  // Helpers
  private allPlayersReady(): boolean {
    if (this.state.players.size < 2) return false;

    for (const player of this.state.players.values()) {
      if (!player.isReady) return false;
    }

    return true;
  }

  private startCountdown() {
    this.state.phase = "countdown";
    this.state.countdown = 6;

    console.log("Starting countdown...");

    this.countdownInterval = setInterval(() => {
      this.state.countdown--;

      if (this.state.countdown <= 0) {
        this.startGame();
      }
    }, 1000);
  }

  private startGame() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.state.phase = "playing";
    console.log("Game started!");

    this.broadcast("game:started");
  }

  private resetGame() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.state.phase = "waiting";
    this.state.countdown = 6;
    this.state.winnerId = null;

    this.state.players.forEach((player) => {
      player.isReady = false;
      player.x = 0;
      player.y = 0;
    });

    console.log("Game reset!");
  }

  private endGame(winnerId: string) {
    this.state.phase = "ended";
    this.state.winnerId = winnerId;

    console.log(`Game ended! Winner: ${winnerId}`);

    this.broadcast("game:ended", { winnerId });
  }
}
