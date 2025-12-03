import prisma from "../db/database";

const SCORE_GAIN = {
	WIN: 30,
	LOSS: -15,
  };
  
  export function calculateNewScore(oldScore: number, result: "WIN" | "LOSS") {
	return oldScore + SCORE_GAIN[result];
  }
  
  export function calculateLevel(score: number) {
	return Math.floor(score / 100);
  }

  const divisions = [
	"IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
	"DIAMOND", "ASCENDANT", "IMMORTAL", "MASTER"
  ] as const;
  
  const tiers = ["III", "II", "I"] as const;

  export function calculateRank(score: number) {
	const capped = Math.max(0, score);
	const steps = Math.floor(capped / 100);
  
	const divisionIndex = Math.min(divisions.length - 1, Math.floor(steps / 3));
	const tierIndex = steps % 3;
  
	return {
	  rankDivision: divisions[divisionIndex] as any,
	  rankTier: tiers[tierIndex] as any,
	};
  }
