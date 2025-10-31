export type UserStatus = "online" | "offline" | "idle" | "doNotDisturb";
export type rank_tier = "I" | "II" | "III";

export type RankDivision =
  | "Iron"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Ascendant"
  | "Immortal"
  | "Master";
export interface User {
	id : string;
  userId: number;
	firstName: string;
	lastName: string;
	username: string;
  status : UserStatus;
	lastSeen: Date;
	avatar : string;
	banner?: string;
	bio?: string;
	createdAt: Date;
	updatedAt: Date;
  preferences: UserPreferences;
	isVerified: boolean;
	walletBalance: number; // In-game currency balance
  // ranking
	level: number;
	rankDivision : RankDivision;
  rankTier: rank_tier;
	// Statistics
	playerStats: PlayerStats;
  // Character related
  playerCharacters: string[]; // Array of character IDs owned by the player
  playerSelectedCharacter: string; // Currently selected character ID
  // Paddle related
  playerPaddles: string[]; // Array of paddle IDs owned by the player
  playerSelectedPaddle: string; // Currently selected paddle ID
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
	totalGames: number; // not here.
	matchHistory: string[]; // Array of match IDs

  // Basic statistics (1 vs 1)
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;

  // Tournament statistics
  tournamentsPlayed: number;
  tournamentsWon: number;
  tournamentsLost: number;

  // Vs AI statistics
  vsAIStats: {
    easy: {
      gamesPlayed: number;
      gamesWon: number;
      gamesLost: number;
    };
    medium: {
      gamesPlayed: number;
      gamesWon: number;
      gamesLost: number;
    };
    hard: {
      gamesPlayed: number;
      gamesWon: number;
      gamesLost: number;
    };
  };

  // Streak statistics
  winStreak: number; // Current win streak
  loseStreak: number; // Current lose streak
  longestWinStreak: number; // Longest win streak

  // Game Performance
  averageGameDuration: number; // Average duration of a game in seconds
  totalPlayTime: number; // Total play time in seconds

  // Socials  
  friendsCount: number; // Number of friends

  // Bounce Challenge statistics
  bounceChallengeBestScore: number; 
  bounceChallengeGamesPlayed: number; 
}