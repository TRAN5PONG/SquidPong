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
  getRoundName,
  shuffleArray,
  validateTournamentStatus,
} from "../utils/tournament";

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
    });

    if (!tournamentToDelete) {
      return reply.code(404).send({
        success: false,
        message: "Tournament not found.",
      });
    }

    console.log(
      "====================,",
      tournamentToDelete.organizerId,
      userId
    );

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

export async function updateTournamentStatus(
  request: FastifyRequest,
  reply: FastifyReply
) {}

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

    // If maxPlayers reached, set status to READY
    if (
      updatedTournament &&
      updatedTournament.participants.length === updatedTournament.maxPlayers
    ) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.READY },
      });
    }

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
      for (let i = 1; i <= totalRounds; i++) {
        const round = await tx.tournamentRoundData.create({
          data: {
            tournamentId: tournamentId,
            name: getRoundName(i, totalRounds),
            order: i,
          },
        });
        createdRounds.push(round);
        console.log(`Created round ${i}: ${round.name}`);
      }

      const allMatches = [];

      for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
        const round = createdRounds[roundIndex];

        // Calculate matches per round (e.g., 4 players: round 1 = 2 matches, round 2 = 1 match)
        const matchesInThisRound = Math.pow(2, totalRounds - roundIndex - 1);
        console.log(
          `Round ${roundIndex + 1} (${
            round.name
          }): ${matchesInThisRound} matches`
        );

        for (
          let matchIndex = 0;
          matchIndex < matchesInThisRound;
          matchIndex++
        ) {
          const opponent1Id =
            roundIndex === 0 ? shuffledPlayers[matchIndex * 2].id : null;
          const opponent2Id =
            roundIndex === 0 ? shuffledPlayers[matchIndex * 2 + 1].id : null;

          allMatches.push({
            roundId: round.id,
            opponent1Id,
            opponent2Id,
            status: GameStatus.PENDING,
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          });
        }
      }

      console.log(`Creating ${allMatches.length} total matches`);
      await tx.tournamentMatch.createMany({ data: allMatches });

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

export async function reportMatchResult(
  request: FastifyRequest,
  reply: FastifyReply
) {}
