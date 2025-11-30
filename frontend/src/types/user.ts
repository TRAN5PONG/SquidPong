import Avatar from "@/components/Tournament/Avatar";
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
  paddleColor: string;
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
    avatar:
      "https://i.pinimg.com/564x/6e/2e/91/6e2e914b49c7aa38572a8668d527b6e2.jpg",
    banner:
      "https://www.bodegafilms.com/wp-content/uploads/2015/11/CASANEGRAHD1.jpg",
    playerSelectedCharacter: "Zero",
  },
  {
    id: 1,
    first_name: "khalid",
    last_name: "ait baatag",
    nickname: "zenitsu",
    email: "khalid@gmail.com",
    rankDivision: "MASTER",
    rankTier: "III",
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUrmBGFB6_xCbCiM1Nrdun8nIOezsdXqM4-yhlQ5doJHnyqWQljD5KW37qaGEaIw_Sb6k",
    banner:
      "https://i.pinimg.com/originals/1e/0c/10/1e0c10c130960c2acfddd62712a90fc8.gif",
    playerSelectedCharacter: "Zenitsu",
  },
  {
    id: 3,
    first_name: "mohammed",
    last_name: "med",
    nickname: "medd",
    email: "medd@gmail.com",
    rankDivision: "ASCENDANT",
    rankTier: "III",
    avatar:
      "https://i.pinimg.com/280x280_RS/80/5a/94/805a9434cb210fb836581c94fd8cb3dc.jpg",
    banner: "https://giffiles.alphacoders.com/220/220122.gif",
    playerSelectedCharacter: "Med",
  },
  {
    id: 2,
    first_name: "abdelbassat",
    last_name: "quaoubai",
    nickname: "xylar-99",
    email: "abdelbassat.quaoubai99@gmail.com",
    rankDivision: "PLATINUM",
    rankTier: "III",
    avatar:
      "https://cdn.shopify.com/s/files/1/0689/6061/6685/files/Attack_On_Titan_600x600.webp?v=1716378598",
    banner:
      "https://i.pinimg.com/originals/75/1e/bd/751ebdacf66989319109a326d2f7efcc.gif",
    playerSelectedCharacter: "Xylar",
  },
  {
    id: 3,
    first_name: "SquidPong",
    last_name: "AI",
    nickname: "SquidPong_ai",
    email: "squidPongAi@gmail.com",
    rankDivision: "MASTER",
    rankTier: "I",
    avatar:
      "https://media.tenor.com/CVLHiD2orA8AAAAe/squid-game-dolls-staring-at-each-other.png",
    banner:
      "https://i.pinimg.com/originals/33/9f/f8/339ff86fa450d4083240c3d29189f850.gif",
    playerSelectedCharacter: "Younajja",
  },
];
