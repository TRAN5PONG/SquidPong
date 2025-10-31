import { Rank, rank_tier, RankDivision, RANKS } from "@/types/game/rank";

export const getRankMetaData = (
  rank_division: RankDivision,
  rank_tier: rank_tier
): Rank | null | undefined => {
  const rankMetadata =
    rank_division === "MASTER"
      ? RANKS.find((rank: Rank) => rank.division === "MASTER")
      : RANKS.find(
          (rank: Rank) =>
            rank.division === rank_division && rank.tier === rank_tier
        ) || null;
  return rankMetadata;
};
