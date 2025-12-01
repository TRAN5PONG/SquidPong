import { rank_tier, RankDivision } from "./rank";

// 1vs1 settings
export type powerUps = "fireBall" | "freezeBall" | "shield" | "Confusion";
export type GameMode =
  | "ONE_VS_ONE"
  | "1vsAI"
  | "Tournament"
  | "BounceChallenge";
export type ScoreLimit = 5 | 10 | 15 | 20;
export type PauseTime = 30 | 60 | 90; // in seconds
// vsAi settings
export type AIDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXTREME";

export type GameStatus =
  | "WAITING"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface MatchPlayer {
  id: string;
  userId: string; // User ID of the player
  gmUserId: string;
  username: string; // Name of the player
  finalScore: number; // Current score of the player
  isReady: boolean; // Whether the player is ready to start the match
  isHost: boolean; // Whether the player is the host of the match
  isResigned: boolean; // Whether the player has resigned from the match
  isWinner: boolean; // Whether the player won the match
  isConnected: boolean;
  pauseRequests: number;
  remainingPauseTime: number;

  characterId: string; // ID of the character selected by the player
  paddleId: string;
  avatarUrl: string;

  rankDivision: RankDivision;
  rankTier: rank_tier;
  rankChange?: number; // Change in rank points after the match (ex: +10, -5)
}

export interface GameSettings {
  // ballSize: number;
  // ballSpeed: number;
  aiDifficulty?: AIDifficulty; // Difficulty level of the AI (only for 1vsAI mode)
  rules: GameRules;
  requiredCurrency: number; // Currency required to play the match
}

export interface GameRules {
  maxScore: ScoreLimit; // Maximum score to win the match
  allowPowerUps: boolean; // Whether power-ups are enabled
  pauseTime?: PauseTime; // Time allowed for a pause in seconds (only for multiplayer)
}

export interface Match {
  id: string;
  roomId: string; // Colyseus room ID
  mode: GameMode;
  status: GameStatus;
  opponent1: MatchPlayer;
  opponent2: MatchPlayer;
  duration: number; // Duration of the match in seconds
  settings?: GameSettings; // Game settings for the match
  createdAt: Date;
  completedAt?: Date;
  winnerId?: string;
}

export interface GameInvitation {
  id: string;
  inviteCode: string;
  type: "PUBLIC" | "PRIVATE";
  status: "PENDING" | "ACCEPTED" | "CANCELLED" | "EXPIRED" | "DECLINED";
  sender: {
    id: string;
    username: string;
    level: number;
    rank: RankDivision;
    coinsBalance: number;
    userId: string;
  };
  receiver?: {
    id: string;
    username: string;
    level: number;
    rank: RankDivision;
    coinsBalance: number;
    userId: string;
  };
  expiresAt: Date;
  scoreLimit: string;
  pauseTime: string;
  allowPowerUps: boolean;
  requiredCurrency: number; // Currency required to play the match
  message?: string; // Optional message from the sender
}

export const GamePowerUps: {
  type: powerUps;
  image: string;
  description: string;
}[] = [
  {
    type: "fireBall",
    image: "/assets/powerUps/fireBall.png",
    description:
      "Ignite the ball to increase its speed and make it harder to return.",
  },
  {
    type: "freezeBall",
    image: "/assets/powerUps/freezeBall.png",
    description:
      "Freeze the ball to decrease its speed and make it easier to return.",
  },
  {
    type: "shield",
    image: "/assets/powerUps/shield.png",
    description:
      "Activate a shield that protects your paddle from one opponent's power-up.",
  },
  {
    type: "Confusion",
    image: "/assets/powerUps/confusion.png",
    description:
      "Confuse your opponent by reversing their paddle controls for a short duration.",
  },
];
