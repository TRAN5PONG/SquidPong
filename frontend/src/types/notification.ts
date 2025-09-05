import { User } from "./user";

export type NotificationType =
  | "info"
  | "warning"
  | "friendRequest"
  | "friendRequestAccepted"
  | "gameInvite"
  | "tournamentInvite"
  | "tournamentCancelled"
  | "CoinGiftReceived" // a coin gift has been received
  | "AchievementUnlocked" // an achievement has been unlocked
  | "coinGiftReceived"
  | "spectateInvite" // a friend invites you to spectate a game
  | "predictionWon"; // a prediction you made has been won

export interface NotificationEl {
  id: string;
  type: NotificationType;
  by?: User; // User who triggered the notification
  createdAt: Date;
  isRead: boolean;

  payload?: {
    info?: string;
    warning?: string;

    friendRequest?: {
      id: string;
      status: "pending" | "accepted" | "declined";
	  message?: string; // Optional message with the friend request
    };

	gameId?: string;

    tournamentName?: string;
    tournamentId?: string;

	achievementId?: string;
	achievementName?: string;

    coinAmount?: number;
    spectateGameId?: string;

    predictionId?: string;
	winningsAmount?: number; // Amount won from the prediction
  };
}
