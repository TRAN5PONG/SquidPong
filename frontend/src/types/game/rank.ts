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
