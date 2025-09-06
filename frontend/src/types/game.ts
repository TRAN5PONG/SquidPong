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
  username: string; // Name of the player
  finalScore: number; // Current score of the player
  isReady: boolean; // Whether the player is ready to start the match
  isHost: boolean; // Whether the player is the host of the match
  isResigned: boolean; // Whether the player has resigned from the match
  isWinner: boolean; // Whether the player won the match

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
  };
  receiver?: {
    id: string;
    username: string;
    level: number;
    rank: RankDivision;
    coinsBalance: number;
  };
  expiresAt: Date;
  scoreLimit: string;
  pauseTime: string;
  allowPowerUps: boolean;
  requiredCurrency: number; // Currency required to play the match
  message?: string; // Optional message from the sender
}

export interface GameCharacter {
  id: string;
  name: string; // Name of the character
  description: string; // Description of the character
  image: string; // Image URL of the character
  avatar: string; // Avatar URL of the character
  price: number; // Price of the character in in-game currency
  spinControl: number; // Spin control value of the character
  reflexSpeed: number; // Reflex speed value of the character
  powerShot: number; // Power shot value of the character
}

export const characters: GameCharacter[] = [
  {
    id: "Zero",
    name: "Zero",
    description: "A mysterious character with unmatched speed and agility.",
    image: "/characters/master.webp",
    avatar: "/characters/master_avatar_.png",
    price: 1000,
    spinControl: 85,
    reflexSpeed: 90,
    powerShot: 80,
  },
  {
    id: "Taizen",
    name: "Taizen",
    description:
      "A powerful warrior with a strong will and unmatched strength.",
    image: "/characters/guard.webp",
    avatar: "/characters/guard_avatar.png",
    price: 1500,
    spinControl: 75,
    reflexSpeed: 80,
    powerShot: 95,
  },
  {
    id: "Kira",
    name: "Kira",
    description: "A skilled fighter with a sharp mind and quick reflexes.",
    image: "/characters/green_m1.webp",
    avatar: "/characters/green_m1_avatar.png",
    price: 1200,
    spinControl: 80,
    reflexSpeed: 85,
    powerShot: 90,
  },
  {
    id: "Ryu",
    name: "Ryu",
    description: "A legendary fighter known for his MASTERy of martial arts.",
    image: "/characters/green_f1.webp",
    avatar: "/characters/green_f1_avatar.png",
    price: 2000,
    spinControl: 90,
    reflexSpeed: 95,
    powerShot: 100,
  },
  {
    id: "Akira",
    name: "Akira",
    description: "A fierce warrior with a burning passion for victory.",
    image: "/characters/green_m2.webp",
    avatar: "/characters/green_m2_avatar.png",
    price: 1800,
    spinControl: 88,
    reflexSpeed: 92,
    powerShot: 85,
  },
  {
    id: "Sora",
    name: "Sora",
    description: "A brave hero with a heart of GOLD and a spirit of adventure.",
    image: "/characters/green_f2.webp",
    avatar: "/characters/green_f2_avatar.png",
    price: 1600,
    spinControl: 82,
    reflexSpeed: 87,
    powerShot: 90,
  },
  {
    id: "Sora",
    name: "Sora",
    description: "A brave hero with a heart of GOLD and a spirit of adventure.",
    image: "/characters/green_m3.webp",
    avatar: "/characters/green_m3_avatar.png",
    price: 1600,
    spinControl: 82,
    reflexSpeed: 87,
    powerShot: 90,
  },
  {
    id: "Sora",
    name: "Sora",
    description: "A brave hero with a heart of GOLD and a spirit of adventure.",
    image: "/characters/green_f3.webp",
    avatar: "/characters/green_f3_avatar.png",
    price: 1600,
    spinControl: 12,
    reflexSpeed: 87,
    powerShot: 90,
  },
];

export interface GamePaddle {
  id: string;
  name: string; // Name of the paddle
  description: string; // Description of the paddle
  image: string; // Image URL of the paddle
  texture: string; // Texture name for the paddle
  price: number; // Price of the paddle in in-game currency
}

export const paddles: GamePaddle[] = [
  {
    id: "Boss",
    name: "Boss",
    description: "Rule the game like the ultimate leader!",
    image: "/paddle/Boss.png",
    texture: "Boss",
    price: 500,
  },
  {
    id: "Survivor",
    name: "Survivor",
    description: "The last one standing from the deadly games.",
    image: "/paddle/Survivor.png",
    texture: "Survivor",
    price: 600,
  },
  {
    id: "Guard",
    name: "Guard",
    description: "Dominate the table with this powerful elite paddle!",
    image: "/paddle/Guard.png",
    texture: "Guard",
    price: 700,
  },
  {
    id: "Army",
    name: "Army",
    description: "Crush opponents like an unstoppable force!",
    image: "/paddle/Army.png",
    texture: "Army",
    price: 800,
  },
];

export type rank_tier = "I" | "II" | "III";

export type RankDivision =
  | "IRON"
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "ASCENDANT"
  | "IMMORTAL"
  | "MASTER";

export interface Rank {
  division: RankDivision;
  tier: rank_tier | null;
  image: string;
  description: string;
  minPoints: number;
  // metadata
  primaryColor: string;
  secondaryColor: string;
}

export const RANKS: Rank[] = [
  // IRON
  {
    division: "IRON",
    tier: "I",
    image: "/badges/IRON_1_Rank.png",
    minPoints: 0,
    description: "Just starting out.",
    primaryColor: "#545654",
    secondaryColor: "#53585B",
  },
  {
    division: "IRON",
    tier: "II",
    image: "/badges/IRON_2_Rank.png",
    minPoints: 100,
    description: "Learning the ropes.",
    primaryColor: "#545654",
    secondaryColor: "#53585B",
  },
  {
    division: "IRON",
    tier: "III",
    image: "/badges/IRON_3_Rank.png",
    minPoints: 200,
    description: "Getting better!",
    primaryColor: "#545654",
    secondaryColor: "#53585B",
  },

  // BRONZE
  {
    division: "BRONZE",
    tier: "I",
    image: "/badges/BRONZE_1_Rank.png",
    minPoints: 300,
    description: "No longer a beginner.",
    primaryColor: "#996c19",
    secondaryColor: "#A5865C",
  },
  {
    division: "BRONZE",
    tier: "II",
    image: "/badges/BRONZE_2_Rank.png",
    minPoints: 400,
    description: "Showing progress.",
    primaryColor: "#996c19",
    secondaryColor: "#A5865C",
  },
  {
    division: "BRONZE",
    tier: "III",
    image: "/badges/BRONZE_3_Rank.png",
    minPoints: 500,
    description: "Top of BRONZE tier.",
    primaryColor: "#996c19",
    secondaryColor: "#A5865C",
  },

  // SILVER
  {
    division: "SILVER",
    tier: "I",
    image: "/badges/SILVER_1_Rank.png",
    minPoints: 600,
    description: "Decent paddler.",
    primaryColor: "#BDBFBD",
    secondaryColor: "#EBF3F1",
  },
  {
    division: "SILVER",
    tier: "II",
    image: "/badges/SILVER_2_Rank.png",
    minPoints: 700,
    description: "Improving consistently.",
    primaryColor: "#BDBFBD",
    secondaryColor: "#EBF3F1",
  },
  {
    division: "SILVER",
    tier: "III",
    image: "/badges/SILVER_3_Rank.png",
    minPoints: 800,
    description: "Almost ready for GOLD.",
    primaryColor: "#BDBFBD",
    secondaryColor: "#EBF3F1",
  },

  // GOLD
  {
    division: "GOLD",
    tier: "I",
    image: "/badges/GOLD_1_Rank.png",
    minPoints: 900,
    description: "Solid contender.",
    primaryColor: "#EAC74D",
    secondaryColor: "#F7EBB7",
  },
  {
    division: "GOLD",
    tier: "II",
    image: "/badges/GOLD_2_Rank.png",
    minPoints: 1000,
    description: "You're being noticed.",
    primaryColor: "#EAC74D",
    secondaryColor: "#F7EBB7",
  },
  {
    division: "GOLD",
    tier: "III",
    image: "/badges/GOLD_3_Rank.png",
    minPoints: 1100,
    description: "GOLDen warrior.",
    primaryColor: "#EAC74D",
    secondaryColor: "#F7EBB7",
  },

  // PLATINUM
  {
    division: "PLATINUM",
    tier: "I",
    image: "/badges/PLATINUM_1_Rank.png",
    minPoints: 1200,
    description: "Sharp and focused.",
    primaryColor: "#52D3DE",
    secondaryColor: "#3DA7B8",
  },
  {
    division: "PLATINUM",
    tier: "II",
    image: "/badges/PLATINUM_2_Rank.png",
    minPoints: 1300,
    description: "Your skill shows.",
    primaryColor: "#52D3DE",
    secondaryColor: "#3DA7B8",
  },
  {
    division: "PLATINUM",
    tier: "III",
    image: "/badges/PLATINUM_3_Rank.png",
    minPoints: 1400,
    description: "Top of your game.",
    primaryColor: "#52D3DE",
    secondaryColor: "#3DA7B8",
  },

  // DIAMOND
  {
    division: "DIAMOND",
    tier: "I",
    image: "/badges/DIAMOND_1_Rank.png",
    minPoints: 1500,
    description: "Elite player.",
    primaryColor: "#EF98F4",
    secondaryColor: "#C588F7",
  },
  {
    division: "DIAMOND",
    tier: "II",
    image: "/badges/DIAMOND_2_Rank.png",
    minPoints: 1600,
    description: "Brilliance and precision.",
    primaryColor: "#EF98F4",
    secondaryColor: "#C588F7",
  },
  {
    division: "DIAMOND",
    tier: "III",
    image: "/badges/DIAMOND_3_Rank.png",
    minPoints: 1700,
    description: "Top 10% tier.",
    primaryColor: "#EF98F4",
    secondaryColor: "#C588F7",
  },

  // ASCENDANT
  {
    division: "ASCENDANT",
    tier: "I",
    image: "/badges/ASCENDANT_1_Rank.png",
    minPoints: 1800,
    description: "On the rise.",
    primaryColor: "#1E8D53",
    secondaryColor: "#21A860",
  },
  {
    division: "ASCENDANT",
    tier: "II",
    image: "/badges/ASCENDANT_2_Rank.png",
    minPoints: 1900,
    description: "Few can stop you.",
    primaryColor: "#1E8D53",
    secondaryColor: "#21A860",
  },
  {
    division: "ASCENDANT",
    tier: "III",
    image: "/badges/ASCENDANT_3_Rank.png",
    minPoints: 2000,
    description: "A feared opponent.",
    primaryColor: "#1E8D53",
    secondaryColor: "#21A860",
  },

  // IMMORTAL
  {
    division: "IMMORTAL",
    tier: "I",
    image: "/badges/IMMORTAL_1_Rank.png",
    minPoints: 2100,
    description: "Endgame begins here.",
    primaryColor: "#e91e63",
    secondaryColor: "#f06292",
  },
  {
    division: "IMMORTAL",
    tier: "II",
    image: "/badges/IMMORTAL_2_Rank.png",
    minPoints: 2200,
    description: "Dominating the charts.",
    primaryColor: "#e91e63",
    secondaryColor: "#f06292",
  },
  {
    division: "IMMORTAL",
    tier: "III",
    image: "/badges/IMMORTAL_3_Rank.png",
    minPoints: 2300,
    description: "Mythic power.",
    primaryColor: "#e91e63",
    secondaryColor: "#f06292",
  },

  // MASTER (no tier)
  {
    division: "MASTER",
    tier: null,
    image: "/badges/RADIANT_Rank.png",
    minPoints: 2400,
    description: "Top 1% of all players. A living legend.",
    primaryColor: "#FFA231",
    secondaryColor: "#FFA231",
  },
];

export const GamePowerUps: { type: powerUps; image: string; description: string }[] = [
  {
    type: "fireBall",
    image: "/assets/powerUps/fireBall.png",
    description: "Ignite the ball to increase its speed and make it harder to return.",
  },
  {
    type: "freezeBall",
    image: "/assets/powerUps/freezeBall.png",
    description: "Freeze the ball to decrease its speed and make it easier to return.",
  },
  {
    type: "shield",
    image: "/assets/powerUps/shield.png",
    description: "Activate a shield that protects your paddle from one opponent's power-up.",
  },
  {
    type: "Confusion",
    image: "/assets/powerUps/confusion.png",
    description: "Confuse your opponent by reversing their paddle controls for a short duration.",
  }
]