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

export async function assignWinnerToNextMatch(
  tx: any,
  match: any,
  tournamentId: string,
  winnerId: string
) {
  if (!match.nextTournamentMatchId) return;

  const nextMatch = await tx.tournamentMatch.findUnique({
    where: { id: match.nextTournamentMatchId },
    include: {
      opponent1: true,
      opponent2: true,
    },
  });

  if (!nextMatch) return;

  // Determine which slot to fill
  let field: "opponent1Id" | "opponent2Id";

  if (!nextMatch.opponent1Id) {
    field = "opponent1Id";
  } else if (!nextMatch.opponent2Id) {
    field = "opponent2Id";
  } else {
    // Already full → do nothing
    return;
  }

  // Assign winner
  const updatedNextMatch = await tx.tournamentMatch.update({
    where: { id: nextMatch.id },
    data: { [field]: winnerId },
    include: {
      opponent1: true,
      opponent2: true,
      round: {
        include: {
          tournament: {
            include: {
              participants: true,
            },
          },
        },
      },
    },
  });

  // If now FULL → notify game service
  if (updatedNextMatch.opponent1Id && updatedNextMatch.opponent2Id) {
    await sendDataToQueue(
      {
        event: "tournament-match-created",
        tournamentId,
        tournamentMatchId: updatedNextMatch.id,
        opponent1Id: updatedNextMatch.opponent1.userId,
        opponent2Id: updatedNextMatch.opponent2.userId,
      },
      "game"
    );
    await sendDataToQueue(
      {
        type: "tournamentUpdate",
        fromId: updatedNextMatch.opponent1.userId,
        targetId: updatedNextMatch.opponent2.userId,
        data: {
          tournamentName: updatedNextMatch.round.tournament.name,
          info: `you will face ${updatedNextMatch.opponent1.userName} in ${updatedNextMatch.round.name}`,
        },
      },
      "eventhub"
    );
    await sendDataToQueue(
      {
        type: "tournamentUpdate",
        fromId: updatedNextMatch.opponent2.userId,
        targetId: updatedNextMatch.opponent1.userId,
        data: {
          tournamentName: updatedNextMatch.round.tournament.name,
          info: `you will face ${updatedNextMatch.opponent2.userName} in ${updatedNextMatch.round.name}`,
        },
      },
      "eventhub"
    );
  } else if (updatedNextMatch.opponent1Id) {
    console.log("+++", updatedNextMatch)
    await sendDataToQueue(
      {
        type: "tournamentUpdate",
        fromId: updatedNextMatch.opponent1.userId,
        targetId: updatedNextMatch.opponent1.userId,
        data: {
          tournamentName: updatedNextMatch.round.tournament.name,
          info: `you are qualified to ${updatedNextMatch.round.name}`,
        },
      },
      "eventhub"
    );
  } else if (updatedNextMatch.opponent2Id) {
    console.log("+++", updatedNextMatch)
    await sendDataToQueue(
      {
        type: "tournamentUpdate",
        fromId: updatedNextMatch.opponent2.userId,
        targetId: updatedNextMatch.opponent2.userId,
        data: {
          tournamentName: updatedNextMatch.round.tournament.name,
          info: `you are qualified to ${updatedNextMatch.round.name}`,
        },
      },
      "eventhub"
    );
  }
}
