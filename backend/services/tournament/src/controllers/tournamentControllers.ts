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
) {}

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
      include: { participants: true },
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
      data: participant,
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

    // Reload tournament participants count
    const updatedTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
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

export async function startTournament(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };
    // const headers = request.headers as { "x-user-id": string };
    // const userId = headers["x-user-id"];

    console.log('Starting tournament with id:', id); // Debug log

    // console.log(userId, "===============================================")

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { participants: true, rounds: { include: { matches: true } } },
    });
    if (!tournament)
      return reply
        .code(404)
        .send({ message: "Tournament not found.", success: false });

    // check if tournament organizer is starting the tournament
    // if (tournament.organizerId !== userId)
    //   return reply.code(403).send({
    //     message: "Only the tournament organizer can start the tournament.",
    //     success: false,
    //   });

    const statusError = validateTournamentStatus(tournament.status);
    if (statusError)
      return reply.code(400).send({ message: statusError, success: false });
    const {
      participants,
      maxPlayers,
    }: { participants: TournamentPlayer[]; maxPlayers: number } = tournament;
    if (participants.length !== maxPlayers)
      return reply.code(400).send({
        success: false,
        message: `Tournament requires ${maxPlayers} participants, but currently has ${participants.length}.`,
      });
    // Shuffle players and assign positions
    const shuffledPlayers = shuffleArray(participants);
    await Promise.all(
      shuffledPlayers.map((player, idx) =>
        prisma.tournamentPlayer.update({
          where: { id: player.id },
          data: { bracketPosition: idx },
        })
      )
    );
    const totalRounds = Math.log2(maxPlayers);
    const rounds = [];
    for (let i = 1; i <= totalRounds; i++) {
      rounds.push(
        prisma.tournamentRoundData.create({
          data: {
            tournamentId: id,
            name: getRoundName(i, totalRounds),
            order: i,
          },
        })
      );
    }
    const createdRounds = await Promise.all(rounds);
    const matches = [];
    for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
      const round = createdRounds[roundIndex];
      const matchesCount = Math.pow(2, totalRounds - roundIndex - 1);
      for (let i = 0; i < matchesCount; i++) {
        const opponent1Id = roundIndex === 0 ? shuffledPlayers[i * 2].id : null;
        const opponent2Id =
          roundIndex === 0 ? shuffledPlayers[i * 2 + 1].id : null;
        matches.push({
          roundId: round.id,
          opponent1Id: opponent1Id ?? null,
          opponent2Id: opponent2Id ?? null,
          status: GameStatus.PENDING,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }
    }
    await prisma.tournamentMatch.createMany({ data: matches });
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        status: TournamentStatus.IN_PROGRESS,
        currentRound: TournamentRound.QUALIFIERS,
      },
      include: {
        participants: true,
        rounds: { include: { matches: true } },
      },
    });
    return reply.code(200).send({
      success: true,
      message: "Tournament started successfully.",
      data: updatedTournament,
    });
  } catch (error: any) {
    return reply.code(400).send({
      message: error.message || "Failed to start tournament.",
      success: false,
    });
  }
}

export async function reportMatchResult(
  request: FastifyRequest,
  reply: FastifyReply
) {}
