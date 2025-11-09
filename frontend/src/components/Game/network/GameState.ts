import { MatchPlayer } from "@/types/game/game";
import { Schema } from "@colyseus/schema";

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

export interface MatchState extends Schema {
  players: Map<string, MatchPlayer>;
  spectators: Map<string, Spectator>;
  phase: MatchPhase;
  countdown: number;
  winnerId: string | null;
  pauseBy: string | null;
  scores: Map<string, number>;
  lastHitPlayer: string | null;
  currentServer: string | null;
}
