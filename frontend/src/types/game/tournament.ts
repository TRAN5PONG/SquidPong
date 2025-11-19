import { GameStatus } from "./game";

export type TournamentRound =
  | "QUALIFIERS"
  | "ROUND_OF_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "FINAL";
export type TournamentStatus =
  | "REGISTRATION"
  | "READY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type TournamentMaxPlayers = 4 | 8 | 16 | 32;

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  organizerId: string; // User ID of the organizer
  maxPlayers: TournamentMaxPlayers;
  currentRound?: TournamentRound;
  status: TournamentStatus;
  rounds: Round[];
  createdAt: Date;
  updatedAt: Date;
  winnerId?: string; // User ID of the tournament winner
  participationFee?: number; // Optional fee to participate in the tournament

  participants: TournamentPlayer[];
}

export interface Round {
  id: String;
  name: TournamentRound;
  order: number;
  tournamentId: String;

  // Relations
  tournament: Tournament;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: TournamentRound;
  status: GameStatus;
  opponent1Id: string;
  opponent2Id: string;
  opponent1Score: number,
  opponent2Score: number,
  winnerId?: string;
  deadline?: Date;
}

export interface TournamentPlayer {
  id: string;
  userId: string;
  bracketPosition?: number; // Position in the tournament bracket
  isEliminated: boolean;
  isReady: boolean; // Whether the player is ready for the match
  tournamentId: string;
  firstName: string;
  lastName: string;
  userName: string;
  avatar: string;
  isVerified: boolean;
  rankDivision: string;
}
