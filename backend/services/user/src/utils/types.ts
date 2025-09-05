// Enums
export type UserStatus = "ONLINE" | "OFFLINE" | "IDLE" | "DO_NOT_DISTURB";
export type RankTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "MASTER" | "GRANDMASTER";
export type RankDivision = "I" | "II" | "III" | "IV" | "V";
export type AIDifficulty = "EASY" | "MEDIUM" | "HARD";
export type FriendshipStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "BLOCKED";
export type MatchStatus = "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type GameMode = "CLASSIC" | "TOURNAMENT" | "VS_AI" | "BOUNCE_CHALLENGE";
export type MatchResult = "WIN" | "LOSS" | "DRAW";
export type TournamentStatus = "REGISTRATION" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

// Main Profile type
export type Profile = {
  id: string;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  lastSeen: string;
  avatar: string;
  banner: string ;
  bio: string ;
  createdAt: Date;
  updatedAt: Date;

  isVerified: boolean;
  walletBalance: number;
  level: number;
  rankDivision: RankDivision;
  rankTier: RankTier;

  preferences: ProfilePreferences;
  playerStats: PlayerStats ;
  ownedCharacters: ProfileCharacter[];
  selectedCharacter?: GameCharacter | null;
  selectedCharacterId?: string | null;

  ownedPaddles: ProfilePaddle[];
  selectedPaddle?: Paddle | null;
  selectedPaddleId?: string | null;

  playerMatches: Match[];
  createdMatches: Match[];
  matchHistory: ProfileMatchHistory[];
  tournamentEntries: TournamentEntry[];

  sentFriendRequests: Friendship[];
  receivedFriendRequests: Friendship[];
};

// Related types
export type ProfilePreferences = {
  id: string;
  profileId: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  twoFactorEnabled: boolean;
  notifications?: NotificationSettings | null;
};

export type NotificationSettings = {
  id: string;
  preferencesId: string;
  friendRequests: boolean;
  chatMessages: boolean;
  gameInvites: boolean;
  tournamentUpdates: boolean;
};


export type PlayerStats = {
  id: string;
  profileId: string;
  score: number;
  rank: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  tournamentsLost: number;
  winStreak: number;
  loseStreak: number;
  longestWinStreak: number;
  averageGameDuration: number;
  totalPlayTime: number;
  friendsCount: number;
  bounceChallengeBestScore: number;
  bounceChallengeGamesPlayed: number;
  vsAIStats: VSAIStats[];
};

export type VSAIStats = {
  id: string;
  playerStatsId: string;
  difficulty: AIDifficulty;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
};

export type GameCharacter = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl: string;
  price: number;
  isDefault: boolean;
};

export type ProfileCharacter = {
  id: string;
  profileId: string;
  characterId: string;
  purchasedAt: Date;
  character: GameCharacter;
};

export type Paddle = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl: string;
  price: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProfilePaddle = {
  id: string;
  profileId: string;
  paddleId: string;
  purchasedAt: Date;
  paddle: Paddle;
};

export type Match = {
  id: string;
  creatorId: string;
  status: MatchStatus;
  gameMode: GameMode;
  startTime?: Date | null;
  endTime?: Date | null;
  winnerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  players: Profile[];
};

export type ProfileMatchHistory = {
  id: string;
  profileId: string;
  matchId: string;
  result: MatchResult;
  score: number;
  match: Match;
};

export type TournamentEntry = {
  id: string;
  profileId: string;
  tournamentId: string;
  position?: number | null;
  joinedAt: Date;
};

export type Friendship = {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
};
