import { Schema, type, MapSchema } from "@colyseus/schema";

// --- Game State ---
export class Paddle extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") z = 0;
  @type("number") velX = 0;
  @type("number") velY = 0;
  @type("number") velZ = 0;
  @type("number") rotationZ = 0;
}

export class Player extends Schema {
  @type("string") id!: string; // MatchPlayer.id
  @type("boolean") isReady = false;
  @type("boolean") isConnected = true;
  @type("number") pauseRequests = 0;
  @type("number") remainingPauseTime!: number;
  @type(Paddle) paddle = new Paddle();
  pauseStartTime: number | null = null;
  pauseTimeout?: NodeJS.Timeout;
}

export class Spectator extends Schema {
  @type("string") id!: string;
  @type("string") username!: string;
}

export class MatchState extends Schema {
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

  @type({ map: "number" }) scores = new MapSchema<number>();
  @type("string") pointBy: string | null = null;
  @type("number") totalPointsScored: number = 0;
  @type("string") lastHitPlayer: string | null = null;
  @type("string") currentServer: string | null = null;

  @type("string") serveState: "waiting_for_serve" | "in_play" =
    "waiting_for_serve";
}
