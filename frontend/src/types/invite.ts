import { GameModes, GameSettings } from "./game/game";
import { TournamentStatus, TournamentType } from "./tournament";

export type InvitationType = "game" | "tournament";
export type InvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

export interface BaseGameInvitation {
  id: string;
  inviterId: string; // User ID of the inviter
  inviteeId: string; // User ID of the invitee
  type: InvitationType; // Type of invitation (game or tournament)
  status: InvitationStatus; // Status of the invitation
  createdAt: Date; // Date when the invitation was created
  expiresAt: Date; // Date when the invitation expires
  respondedAt?: Date; // Date when the invitation was responded to
}

export interface RegularMatchInvitation extends BaseGameInvitation {
  type: "game";
  matchId?: string; // ID of the match if already created
  matchSettings?: {
    mode: GameModes; // Game mode for the match (not sure if this is needed here)
    settings: GameSettings; // Game settings for the match
    customMessage?: string; // Custom message for the invitation
  };
}

export interface TournamentInvitation extends BaseGameInvitation {
  type: "tournament";
  tournamentInfos: {
    tournamentId: string; // ID of the tournament
    tournamentName: string; // Name of the tournament
    requiredCurrency: number; // Currency required to join the tournament
    tournamentType: TournamentType; // Type of the tournament
    tournamentStatus: TournamentStatus; // Status of the tournament
    description?: string; // Description of the tournament
    startDate?: Date; // Start date of the tournament
    maxParticipants?: number; // Maximum number of participants in the tournament
    currentParticipants?: number; // Current number of participants in the tournament
    customMessage?: string; // Custom message for the invitation
  };
}
