import { TournamentStatus, TournamentRound } from "@prisma/client";
import prisma from "../db/database";
import { sendDataToQueue } from "../integration/rabbitmqClient";

export function validateTournamentStatus(status: TournamentStatus) {
  const statusMessages: Record<TournamentStatus, string> = {
    [TournamentStatus.REGISTRATION]: "Tournament is still in registration.",
    [TournamentStatus.READY]: "Tournament is ready.", // Won't be used but needed for type safety
    [TournamentStatus.IN_PROGRESS]: "Tournament is already in progress.",
    [TournamentStatus.COMPLETED]: "Tournament is already completed.",
    [TournamentStatus.CANCELLED]: "Tournament is cancelled.",
  };

  if (status !== TournamentStatus.READY) {
    return statusMessages[status];
  }
  return null;
}
// Helper function to shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}
// Refactored bracket builder
export function buildBrackets(players: { id: string }[]) {
  const playerCount = players.length;

  // Validate power of 2
  if (playerCount === 0 || (playerCount & (playerCount - 1)) !== 0) {
    throw new Error(
      `Player count must be a power of 2. Got ${playerCount} players.`
    );
  }

  const rounds = [];
  let currentRoundSize = playerCount;
  let roundPlayers = players.map((p) => p.id);

  while (currentRoundSize > 1) {
    const matchCount = Math.floor(currentRoundSize / 2);
    const matches = [];

    for (let i = 0; i < matchCount; i++) {
      matches.push({
        opponent1Id: roundPlayers[i * 2] || null,
        opponent2Id: roundPlayers[i * 2 + 1] || null,
        winnerId: null,
      });
    }

    rounds.push({ matches });
    currentRoundSize = matchCount;
    roundPlayers = new Array(matchCount).fill(null);
  }

  return { rounds };
}
export function getRoundName(
  order: number,
  totalRounds: number
): TournamentRound {
  const roundNames = [
    TournamentRound.QUALIFIERS,
    TournamentRound.ROUND_OF_16,
    TournamentRound.QUARTER_FINALS,
    TournamentRound.SEMI_FINALS,
    TournamentRound.FINAL,
  ];

  // Map the order to the correct index from the end
  const index = roundNames.length - (totalRounds - order + 1);
  return roundNames[index] || TournamentRound.QUALIFIERS;
}

export async function assignWinnerToNextMatch(tx: any, match: any, winnerId: string) {
  if (!match.nextTournamentMatchId) return;

  const nextMatch = await tx.tournamentMatch.findUnique({
    where: { id: match.nextTournamentMatchId },
  });
  if (!nextMatch) return;

  if (nextMatch.opponent1Id && nextMatch.opponent2Id) {
    await sendDataToQueue(
      {
        event: "tournament-match-created",
        tournamentId: nextMatch.tournamentId,
        tournamentMatchId: nextMatch.id,
        opponent1Id: nextMatch.opponent1?.userId,
        opponent2Id: nextMatch.opponent2?.userId,
      },
      "game"
    );
  }

  const field = nextMatch.opponent1Id === null ? "opponent1Id" : "opponent2Id";

  await tx.tournamentMatch.update({
    where: { id: nextMatch.id },
    data: { [field]: winnerId },
  });
}

