import { MatchPlayer } from "@/types/game/game";
import { MapSchema, Schema } from "@colyseus/schema";

interface Spectator {
  id: string;
  username: string;
}

export type MatchPhase =
  | "waiting"
  | "countdown"
  | "playing"
  | "paused"
  | "ended";

type ServeState = "waiting_for_serve" | "in_play";

export interface MatchState extends Schema {
  players: Map<string, MatchPlayer>;
  spectators: Map<string, Spectator>;
  phase: MatchPhase;
  countdown: number;
  winnerId: string | null;
  pauseBy: string | null;

  scores: MapSchema<number>;
  lastHitPlayer: string | null;
  currentServer: string | null;
  serveState: ServeState;
  hostPlayerId: string | null;
  gameStartAt: Date;
}
