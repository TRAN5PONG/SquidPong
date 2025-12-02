// Lightweight stubbed controllers for the tournament service.
// The full implementation has been moved to `tournamentControllers.full.ts`.
import { FastifyRequest, FastifyReply } from "fastify";
import prisma from "../db/database";
import {
  TournamentStatus,
  TournamentRound,
  TournamentPlayer,
  GameStatus,
} from "@prisma/client";
import { getUser } from "../utils/user";
import {
  assignWinnerToNextMatch,
  getRoundName,
  shuffleArray,
  validateTournamentStatus,
} from "../utils/tournament";
import { sendDataToQueue } from "../integration/rabbitmqClient";

export async function createTournament(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { name, organizerId, maxPlayers, description, participationFee } =
      request.body as {
        name: string;
        organizerId: string;
        maxPlayers: number;
        description?: string;
        participationFee: number;
      };

    // user can create only 1 active tournament at a time
    const existingActiveTournament = await prisma.tournament.findFirst({
      where: {
        organizerId,
        status: {
          in: [
            TournamentStatus.REGISTRATION,
            TournamentStatus.READY,
            TournamentStatus.IN_PROGRESS,
          ],
        },
      },
    });
    if (existingActiveTournament) {
      return {
        message: "You already have an active tournament.",
        success: false,
      };
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        organizerId,
        maxPlayers,
        participationFee: participationFee || 0,
        status: TournamentStatus.REGISTRATION,
        currentRound: TournamentRound.QUALIFIERS,
      },
    });

    return reply.code(200).send({
      message: "Tournament created successfully.",
      success: true,
      data: tournament,
    });
  } catch (error: any) {
    return reply.code(500).send({
      message: "Failed to create tournament.",
      success: false,
    });
  }
}

export async function deleteTournament(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };

    const headers = request.headers as { "x-user-id": string };
    const userId = headers["x-user-id"];

    const tournamentToDelete = await prisma.tournament.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!tournamentToDelete) {
      return reply.code(404).send({
        success: false,
        message: "Tournament not found.",
      });
    }

    if (tournamentToDelete.organizerId !== userId) {
      return reply.code(403).send({
        success: false,
        message: "You are not authorized to delete this tournament.",
      });
    }

    // Delete matches related to the tournament
    await prisma.tournamentMatch.deleteMany({
      where: { round: { tournamentId: id } },
    });

    // Delete rounds first (matches depend on rounds)
    await prisma.tournamentRoundData.deleteMany({
      where: { tournamentId: id },
    });

    // Delete participants
    await prisma.tournamentPlayer.deleteMany({
      where: { tournamentId: id },
    });

    // Finally, delete the tournament
    const tournament = await prisma.tournament.delete({
      where: { id },
    });

    // Send message to game service to delete related games
    await sendDataToQueue(
      {
        event: "tournament-deleted",
        tournamentId: id,
      },
      "game"
    );

    const participantUserIds = tournamentToDelete?.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.userId);

    await sendDataToQueue(
      {
        type: "tournamentUpdate",
        fromId: userId,
        targetId: participantUserIds,
        data: {
          tournamentName: tournamentToDelete.name,
          info: `organizer has deleted the tournament!`,
        },
      },
      "eventhub"
    );

    await sendDataToQueue(
      {
        targetId: participantUserIds,
        event: "tournament-update",
        data: { tournament: tournamentToDelete, isDeleted: true },
      },
      "broadcastData"
    );

    return reply.code(200).send({
      success: true,
      message: "Tournament deleted successfully.",
      data: tournament,
    });
  } catch (error: any) {
    return reply.code(400).send({
      success: false,
      message:
        error.message || "An error occurred while deleting the tournament.",
    });
  }
}

export async function getTournament(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: true,
        rounds: {
          include: { matches: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!tournament) {
      return reply.code(404).send({
        success: false,
        message: "Tournament not found.",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Tournament fetched successfully.",
      data: tournament,
    });
  } catch (error: any) {
    return reply.code(400).send({
      success: false,
      message:
        error.message || "An error occurred while fetching the tournament.",
    });
  }
}

export async function getTournaments(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        participants: true,
        rounds: {
          include: { matches: true },
        },
      },
    });

    return reply.code(200).send({
      message: "Tournaments fetched successfully.",
      success: true,
      data: tournaments,
    });
  } catch (error: any) {
    return reply.code(400).send({
      message: error.message || "An error occurred while fetching tournaments.",
      success: false,
    });
  }
}

export async function joinTournament(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { tournamentId } = request.params as { tournamentId: string };
    const { participantId } = request.body as { participantId: string };
    const userId = participantId;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });

    // Check if the tournament exists
    if (!tournament) {
      return reply.code(404).send({
        success: false,
        message: "Tournament not found.",
      });
    }

    // check if the tournament is full
    if (tournament.participants.length >= tournament.maxPlayers) {
      return reply.code(400).send({
        success: false,
        message: "Tournament is full.",
      });
    }

    // Check if the user is already a participant
    if (tournament.participants.some((p: any) => p.userId === userId)) {
      return reply.code(400).send({
        success: false,
        message: "You are already a participant in this tournament.",
      });
    }

    // Check if user exists
    const user = await getUser(userId);
    if (!user) {
      return reply.code(404).send({
        success: false,
        message: "User not found.",
      });
    }

    // Add the user to the tournament participants
    const participant = await prisma.tournamentPlayer.upsert({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
      update: {
        avatar: user.data.avatar,
        firstName: user.data.firstName,
        lastName: user.data.lastName,
        isVerified: user.data.isVerified,
        rankDivision: user.data.rankDivision,
        userName: user.data.username,
      },
      create: {
        userId,
        // gmUserId: user.id,
        tournamentId,
        avatar: user.data.avatar,
        firstName: user.data.firstName,
        lastName: user.data.lastName,
        isVerified: user.data.isVerified,
        rankDivision: user.data.rankDivision,
        userName: user.data.username,
      },
    });

    // Reload tournament participants count
    let updatedTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: true,
        rounds: {
          include: { matches: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (
      updatedTournament &&
      updatedTournament.participants.length === updatedTournament.maxPlayers
    ) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.READY },
      });

      updatedTournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: true,
          rounds: {
            include: { matches: true },
            orderBy: { order: "asc" },
          },
        },
      });
    }

    const participantUserIds = updatedTournament?.participants
      .filter((p) => p.userId !== userId)
      .map((p) => p.userId);

    await sendDataToQueue(
      {
        type: "tournamentUpdate",
        fromId: userId,
        targetId: participantUserIds,
        data: {
          tournamentName: updatedTournament.name,
          info: `${participant.userName} has joined the tournament!`,
        },
      },
      "eventhub"
    );

    await sendDataToQueue(
      {
        targetId: participantUserIds,
        event: "tournament-update",
        data: { tournament: updatedTournament },
      },
      "broadcastData"
    );

    return reply.code(201).send({
      success: true,
      message: "Joined tournament successfully.",
      data: updatedTournament,
    });
  } catch (error: any) {
    console.error("Error joining tournament:", error);
    return reply.code(400).send({
      success: false,
      message:
        error.message || "An error occurred while joining the tournament.",
    });
  }
}

export async function leaveTournament(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { tournamentId } = request.params as { tournamentId: string };
    const { participantId } = request.body as { participantId: string };

    // Check if the tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });
    if (!tournament) {
      return reply.code(404).send({
        success: false,
        message: "Tournament not found.",
      });
    }

    // Check if the user is a participant
    const participant = tournament.participants.find(
      (p: any) => p.userId === participantId
    );
    if (!participant) {
      return reply.code(400).send({
        success: false,
        message: "You are not a participant in this tournament.",
      });
    }

    // if tournament is in progress, eliminate the participant
    if (tournament.status === TournamentStatus.IN_PROGRESS) {
      await prisma.tournamentPlayer.update({
        where: { id: participant.id },
        data: { isEliminated: true },
      });
      return reply.code(200).send({
        success: true,
        message: "You have been eliminated from the tournament.",
      });
      // TODO : make the opponent win the match
    }

    // Remove the user from the tournament participants
    await prisma.tournamentPlayer.delete({
      where: { id: participant.id },
    });

    // Reload tournament participants count
    const updatedTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: true,
        rounds: {
          include: { matches: true },
          orderBy: { order: "asc" },
        },
      },
    });

    const participantUserIds = updatedTournament?.participants
      .filter((p) => p.userId !== participantId)
      .map((p) => p.userId);

    await sendDataToQueue(
      {
        type: "tournamentUpdate",
        fromId: participantId,
        targetId: participantUserIds,
        data: {
          tournamentName: updatedTournament.name,
          info: `${participant.userName} has left the tournament!`,
        },
      },
      "eventhub"
    );

    await sendDataToQueue(
      {
        targetId: participantUserIds,
        event: "tournament-update",
        data: { tournament: updatedTournament },
      },
      "broadcastData"
    );

    return reply.code(200).send({
      success: true,
      message: "Left tournament successfully.",
      data: updatedTournament,
    });
  } catch (error: any) {
    return reply.code(400).send({
      success: false,
      message:
        error.message || "An error occurred while leaving the tournament.",
    });
  }
}

export async function launchTournament(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { tournamentId } = request.params as { tournamentId: string };

    const headers = request.headers as { "x-user-id": string };
    const userId = headers["x-user-id"];

    const result = await prisma.$transaction(async (tx: any) => {
      const tournament = await tx.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: true,
          rounds: { include: { matches: true } },
        },
      });

      if (!tournament) {
        throw new Error("Tournament not found");
      }

      if (tournament.rounds && tournament.rounds.length > 0) {
        throw new Error("Tournament has already been started");
      }

      const statusError = validateTournamentStatus(tournament.status);
      if (statusError) {
        throw new Error(statusError);
      }

      const { participants, maxPlayers } = tournament;
      if (participants.length !== maxPlayers) {
        throw new Error(
          `Tournament requires ${maxPlayers} participants, but currently has ${participants.length}.`
        );
      }

      if (!Number.isInteger(Math.log2(maxPlayers))) {
        throw new Error(
          `maxPlayers must be a power of 2 (2, 4, 8, 16, etc.). Got ${maxPlayers}`
        );
      }

      const shuffledPlayers: TournamentPlayer[] = shuffleArray(participants);
      await Promise.all(
        shuffledPlayers.map((player, idx) =>
          tx.tournamentPlayer.update({
            where: { id: player.id },
            data: { bracketPosition: idx },
          })
        )
      );

      const totalRounds = Math.log2(maxPlayers);
      console.log(`Creating ${totalRounds} rounds for ${maxPlayers} players`);

      const createdRounds = [];
      const createdMatchesByRound: { roundIndex: number; matches: any[] }[] =
        [];

      for (let i = 1; i <= totalRounds; i++) {
        const round = await tx.tournamentRoundData.create({
          data: {
            tournamentId: tournamentId,
            name: getRoundName(i, totalRounds),
            order: i,
          },
        });
        createdRounds.push(round);
      }

      for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
        const round = createdRounds[roundIndex];

        const matchesInThisRound = Math.pow(2, totalRounds - roundIndex - 1);
        const roundMatches: any[] = [];

        for (
          let matchIndex = 0;
          matchIndex < matchesInThisRound;
          matchIndex++
        ) {
          const opponent1 =
            roundIndex === 0 ? shuffledPlayers[matchIndex * 2] : null;
          const opponent2 =
            roundIndex === 0 ? shuffledPlayers[matchIndex * 2 + 1] : null;

          const createdMatch = await tx.tournamentMatch.create({
            data: {
              roundId: round.id,
              opponent1Id: opponent1 ? opponent1.id : null,
              opponent2Id: opponent2 ? opponent2.id : null,
              opponent1Score: 0,
              opponent2Score: 0,
              status: GameStatus.PENDING,
              deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });

          roundMatches.push(createdMatch);
          console.log(roundIndex);
          if (roundIndex === 0) {
            console.log(
              "Sending tournament-match-created for match:",
              createdMatch.id
            );
            await sendDataToQueue(
              {
                event: "tournament-match-created",
                tournamentId,
                tournamentMatchId: createdMatch.id,
                opponent1Id: opponent1?.userId,
                opponent2Id: opponent2?.userId,
              },
              "game"
            );
          }
        }
        createdMatchesByRound.push({
          roundIndex,
          matches: roundMatches,
        });
      }

      // Link matches to their next matches
      for (let i = 0; i < createdMatchesByRound.length - 1; i++) {
        const currentRound = createdMatchesByRound[i];
        const nextRound = createdMatchesByRound[i + 1];

        for (let j = 0; j < currentRound.matches.length; j++) {
          const currentMatch = currentRound.matches[j];
          const nextMatchIndex = Math.floor(j / 2);
          const nextMatch = nextRound.matches[nextMatchIndex];

          await tx.tournamentMatch.update({
            where: { id: currentMatch.id },
            data: { nextTournamentMatchId: nextMatch.id },
          });
        }
      }

      const updatedTournament = await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          status: TournamentStatus.IN_PROGRESS,
          currentRound: TournamentRound.QUALIFIERS,
        },
        include: {
          participants: true,
          rounds: {
            include: { matches: true },
            orderBy: { order: "asc" },
          },
        },
      });

      const participantUserIds = updatedTournament?.participants
        .filter((p) => p.userId !== userId)
        .map((p) => p.userId);

      await sendDataToQueue(
        {
          type: "tournamentUpdate",
          fromId: userId,
          targetId: participantUserIds,
          data: {
            tournamentName: updatedTournament.name,
            info: `organizer has started the tournament!`,
          },
        },
        "eventhub"
      );

      await sendDataToQueue(
        {
          targetId: participantUserIds,
          event: "tournament-update",
          data: { tournament: updatedTournament },
        },
        "broadcastData"
      );

      return updatedTournament;
    });

    return reply.code(200).send({
      success: true,
      message: "Tournament started successfully.",
      data: result,
    });
  } catch (error: any) {
    console.error("Error starting tournament:", error);

    const statusCode =
      error.message === "Tournament not found"
        ? 404
        : error.message.includes("already been started")
        ? 409
        : error.message.includes("requires") ||
          error.message.includes("status") ||
          error.message.includes("power of 2")
        ? 400
        : 500;

    return reply.code(statusCode).send({
      message: error.message || "Failed to start tournament.",
      success: false,
    });
  }
}

export async function resetTournament(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { tournamentId } = request.params as { tournamentId: string };
    const headers = request.headers as { "x-user-id": string };
    const userId = headers["x-user-id"];

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    // Reset tournament data
    const updatedTournament = await prisma.$transaction(async (tx: any) => {
      // Delete matches
      await tx.tournamentMatch.deleteMany({
        where: { round: { tournamentId } },
      });

      // Delete rounds
      await tx.tournamentRoundData.deleteMany({
        where: { tournamentId },
      });

      // Reset participants
      await tx.tournamentPlayer.updateMany({
        where: { tournamentId },
        data: {
          isEliminated: false,
          bracketPosition: null,
        },
      });

      // Reset tournament status
      await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          status: TournamentStatus.READY,
          currentRound: null,
        },
      });

      const updatedTournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          participants: true,
        },
      });

      // hit game service to delete all games related to this tournament
      await sendDataToQueue(
        {
          event: "tournament-reset",
          tournamentId: tournamentId,
        },
        "game"
      );

      const participantUserIds = updatedTournament?.participants
        .filter((p) => p.userId !== userId)
        .map((p) => p.userId);

      await sendDataToQueue(
        {
          type: "tournamentUpdate",
          fromId: userId,
          targetId: participantUserIds,
          data: {
            tournamentName: updatedTournament.name,
            info: `organizer has reseted the tournament!`,
          },
        },
        "eventhub"
      );

      await sendDataToQueue(
        {
          targetId: participantUserIds,
          event: "tournament-update",
          data: { tournament: updatedTournament },
        },
        "broadcastData"
      );

      return updatedTournament;
    });

    return reply.code(200).send({
      message: "Tournament has been reset successfully.",
      success: true,
      data: updatedTournament,
    });
  } catch (error: any) {
    console.log(error);
    return reply.code(500).send({
      message: "Failed to reset tournament.",
      success: false,
    });
  }
}

export async function setTournamentMatchId(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const { tournamentId, tournamentMatchId } = request.params as {
      tournamentId: string;
      tournamentMatchId: string;
    };

    const { matchId } = request.body as { matchId: string };

    // Update ONLY this match of this tournament
    const updated = await prisma.tournamentMatch.updateMany({
      where: {
        id: tournamentMatchId,
        round: { tournamentId: tournamentId },
      },
      data: {
        matchId: matchId,
      },
    });

    if (updated.count === 0) {
      return reply.code(404).send({
        success: false,
        message: "Tournament match not found",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Game match ID linked successfully",
    });
  } catch (error: any) {
    return reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
}

export async function reportMatchResult(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { matchId, tournamentId } = request.params as {
    matchId: string;
    tournamentId: string;
  };
  const { winnerId, loserId, winnerScore, loserScore } = request.body as {
    winnerId: string;
    loserId: string;
    winnerScore: number;
    loserScore: number;
  };

  try {
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: { round: true },
    });
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });
    if (!tournament)
      return reply.code(404).send({ message: "Tournament not found." });

    const winnerPlayer = tournament.participants.find(
      (p) => p.userId === winnerId
    );
    const loserPlayer = tournament.participants.find(
      (p) => p.userId === loserId
    );
    if (!winnerPlayer)
      return reply
        .code(404)
        .send({ message: "Winner not found in tournament." });
    if (!loserPlayer)
      return reply
        .code(404)
        .send({ message: "Loser not found in tournament." });

    if (!match) return reply.code(404).send({ message: "Match not found." });
    if (match.round.tournamentId !== tournamentId)
      return reply
        .code(400)
        .send({ message: "Match does not belong to this tournament." });
    if (match.status === GameStatus.COMPLETED)
      return reply.code(400).send({ message: "Match already completed." });

    const result = await prisma.$transaction(async (tx) => {
      // Update match with winner, loser, and scores
      const updatedMatch = await tx.tournamentMatch.update({
        where: { id: matchId },
        data: {
          status: GameStatus.COMPLETED,
          winnerId: winnerPlayer.id,
          opponent1Score:
            match.opponent1Id === winnerPlayer.id ? winnerScore : loserScore,
          opponent2Score:
            match.opponent2Id === winnerPlayer.id ? winnerScore : loserScore,
        },
      });

      // advance winner to next match
      await assignWinnerToNextMatch(tx, match, tournamentId, winnerPlayer.id);

      // Update players
      await tx.tournamentPlayer.update({
        where: { id: loserPlayer.id },
        data: { isEliminated: true },
      });

      await tx.tournamentPlayer.update({
        where: { id: winnerPlayer.id },
        data: { isReady: false },
      });

      // Check if all matches in this round are completed
      const matchesInRound = await tx.tournamentMatch.findMany({
        where: { roundId: match.roundId },
      });

      const allCompleted = matchesInRound.every(
        (m) => m.status === GameStatus.COMPLETED
      );
      // i should advance the winner to the next match here i guess

      if (allCompleted) {
        // Check if tournament is finished
        const remainingPlayers = await tx.tournamentPlayer.findMany({
          where: { tournamentId, isEliminated: false },
        });

        if (remainingPlayers.length === 1) {
          await tx.tournament.update({
            where: { id: tournamentId },
            data: {
              status: TournamentStatus.COMPLETED,
              winnerId: remainingPlayers[0].id,
            },
          });
        }
      }

      return updatedMatch;
    });

    return reply.code(200).send({
      message: "Match result reported successfully.",
      data: result,
      success: true,
    });
  } catch (error: any) {
    return reply
      .code(400)
      .send({ message: error.message || "Error reporting match result." });
  }
}

export async function searchTournaments(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { query } = request.query as { query: string };

    console.log("QUERY:", query);

    const tournaments = await prisma.tournament.findMany({
      where: {
        name: {
          contains: query.toLowerCase(),
        },
      },
      include: {
        participants: true,
        rounds: {
          include: { matches: true },
        },
      },
    });

    return reply.code(200).send({
      message: "Tournaments fetched successfully.",
      success: true,
      data: tournaments,
    });
  } catch (error: any) {
    return reply.code(400).send({
      message:
        error.message || "An error occurred while searching tournaments.",
      success: false,
    });
  }
}
