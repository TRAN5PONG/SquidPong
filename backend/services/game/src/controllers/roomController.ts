interface MatchRoom {
  id: string;
  players: string[];
  spectators: string[];
  status: "waiting" | "in-progress" | "finished";
}

const matches: Record<string, MatchRoom> = {};


