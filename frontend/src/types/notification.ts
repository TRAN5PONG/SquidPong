import { User } from "./user";

export type NotificationType =
  | "INFO"
  | "WARNING"
  | "FRIEND_REQUEST"
  | "FRIEND_REQUEST_ACCEPTED"
  | "GAME_INVITE"
  | "TOURNAMENT_INVITE"
  | "TOURNAMENT_CANCELLED"
  | "TOURNAMENT_UPDATE"
  | "COIN_GIFT_RECEIVED"
  | "ACHIEVEMENT_UNLOCKED"
  | "SPECTATE_INVITE"
  | "PREDICTION_WON";

export interface NotificationEl {
  id: string;
  type: NotificationType;
  by: User; // User who triggered the notification
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
