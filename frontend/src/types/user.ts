import { rank_tier, RankDivision, RANKS } from "./game/rank";

export type UserStatus = "ONLINE" | "OFFLINE" | "IDLE" | "DONOTDISTURB";

export interface User {
  id: string;
  userId: string; // Unique identifier for the user
  firstName: string;
  lastName: string;
  username: string;
  status: UserStatus;
  lastSeen: Date;
  avatar: string;
  banner?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  isVerified: boolean;
  walletBalance: number; // In-game currency balance
  // ranking
  level: number;
  rankDivision: RankDivision;
  rankTier: rank_tier;
  // Statistics
  playerStats: PlayerStats;
  // Character related
  playerCharacters: string[]; // Array of character IDs owned by the player
  playerSelectedCharacter: string | null; // Currently selected character ID
  // Paddle related
  playerPaddles: string[]; // Array of paddle IDs owned by the player
  playerSelectedPaddle: string | null; // Currently selected paddle ID
}

export interface UserPreferences {
  soundEnabled: boolean;
  musicEnabled: boolean;
  twoFactorEnabled: boolean;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  friendRequests: boolean;
  chatMessages: boolean;
  gameInvites: boolean;
  tournamentUpdates: boolean;
}

export interface PlayerStats {
  score: number; // Current score of the player
  rank: number; // Current rank of the player

  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;

  // 1v1 Stats
  played1v1: number;
  won1v1: number;
  lost1v1: number;

  // Tournament statistics
  playedTournament: number;
  wonTournament: number;
  lostTournament: number;

  // Vs AI statistics
  playedVsAI: number;
  easyPlayed: number;
  easyWins: number;
  easyLosses: number;
  mediumPlayed: number;
  mediumWins: number;
  mediumLosses: number;
  hardPlayed: number;
  hardWins: number;
  hardLosses: number;

  // Streak statistics
  winStreak: number; // Current win streak
  loseStreak: number; // Current lose streak
  longestWinStreak: number; // Longest win streak

  // Bounce Challenge statistics
  bounceChallengeBestScore: number;
  bounceChallengeGamesPlayed: number;

  // Game Performance
  averageGameDuration: number; // Average duration of a game in seconds
  totalPlayTime: number; // Total play time in seconds
}

export const defaultStats: PlayerStats = {
  averageGameDuration: 0,
  bounceChallengeBestScore: 0,
  bounceChallengeGamesPlayed: 0,
  easyLosses: 0,
  easyPlayed: 0,
  easyWins: 0,
  gamesLost: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  hardLosses: 0,
  hardPlayed: 0,
  hardWins: 0,
  longestWinStreak: 0,
  loseStreak: 0,
  lost1v1: 0,
  mediumLosses: 0,
  mediumPlayed: 0,
  mediumWins: 0,
  played1v1: 0,
  playedVsAI: 0,
  rank: 0,
  score: 0,
  totalPlayTime: 0,
  lostTournament: 0,
  playedTournament: 0,
  wonTournament: 0,
  winStreak: 0,
  won1v1: 0,
};

export const recommandedPlayers = [
  {
    id: 0,
    first_name: "hassan",
    last_name: "karrach",
    nickname: "zero",
    email: "hassan.winners@gmail.com",
    rankDivision: "IMMORTAL",
    rankTier: "III",
  },
  {
    id: 1,
    first_name: "khalid",
    last_name: "ait baatag",
    nickname: "zenitsu",
    email: "khalid@gmail.com",
    rankDivision: "MASTER",
    rankTier: "III",
  },
  {
    id: 3,
    first_name: "mohammed",
    last_name: "med",
    nickname: "medd",
    email: "medd@gmail.com",
    rankDivision: "ASCENDANT",
    rankTier: "III",
  },
  {
    id: 2,
    first_name: "abdelbassat",
    last_name: "quaoubai",
    nickname: "xylar-99",
    email: "abdelbassat.quaoubai99@gmail.com",
    rankDivision: "PLATINUM",
    rankTier: "III",
  },
  {
    id: 3,
    first_name: "SquidPong",
    last_name: "AI",
    nickname: "SquidPong_ai",
    email: "squidPongAi@gmail.com",
    rankDivision: "MASTER",
    rankTier: "I",
  },
];
