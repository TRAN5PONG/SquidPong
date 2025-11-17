// import { FastifyRequest, FastifyReply } from "fastify";


// import { GameStatus, TournamentRound, TournamentStatus } from '@prisma/client';

// import prisma from "../db/database";

// // tournaments management
// export async function createTournament(
//   request: FastifyRequest,
//   reply: FastifyReply
// ) {
//   try {
//     const { name, organizerId, maxPlayers, description } = request.body as {
//       name: string;
//       organizerId: string;
//       maxPlayers: number;
//       description?: string;
//     };

//     const tournament = await prisma.tournament.create({
//       data: {
//         name,
//         description,
//         organizerId,
//         maxPlayers,
//         participationFee: 0,
//         status: TournamentStatus.REGISTRATION,
//         currentRound: TournamentRound.QUALIFIERS,
//       },
//     });

//     return reply.code(200).send({
//       message: "Tournament created successfully.",
//       data: tournament,
//     });
//   } catch (error: any) {
//     return reply.code(400).send({
//       message:
//         error.message || "An error occurred while creating the tournament.",
//     });
//   }
// }
// export async function deleteTournament(
//   request: FastifyRequest,
//   reply: FastifyReply
// ) {
//   try {
//     const { id } = request.params as { id: string };

//     // Delete matches related to the tournament
//     await prisma.tournamentMatch.deleteMany({
//       where: { round: { tournamentId: id } },
//     });

//     // Delete rounds first (matches depend on rounds)
//     await prisma.tournamentRoundData.deleteMany({
//       where: { tournamentId: id },
//     });

//     // Delete participants
//     await prisma.tournamentPlayer.deleteMany({
//       where: { tournamentId: id },
//     });

//     // Finally, delete the tournament
//     const tournament = await prisma.tournament.delete({
//       where: { id },
//     });

//     return reply.code(200).send({
//       message: "Tournament deleted successfully.",
//       data: tournament,
//     });
//   } catch (error: any) {
//     return reply.code(400).send({
//       message:
//         error.message || "An error occurred while deleting the tournament.",
//     });
//   }
// }

// export async function updateTournamentStatus(
//   request: FastifyRequest,
//   reply: FastifyReply
// ) {
//   try {
//     const { id } = request.params as { id: string };
//     const { nextStatus } = request.body as { nextStatus: TournamentStatus };

//     const allowedTransitions: Record<TournamentStatus, TournamentStatus[]> = {
//       REGISTRATION: ["READY", "CANCELLED"],
//       READY: ["IN_PROGRESS", "CANCELLED"],
//       IN_PROGRESS: ["COMPLETED", "CANCELLED"],
//       COMPLETED: [],
//       CANCELLED: [],
//     };

//     const tournament = await prisma.tournament.findUnique({
//       where: { id },
//     });

//     if (!tournament) {
//       return reply.code(404).send({ message: "Tournament not found." });
//     }

//     const allowed = allowedTransitions[tournament.status];
//     if (!allowed.includes(nextStatus)) {
//       return reply.code(400).send({
//         message: `Cannot transition from ${tournament.status} to ${nextStatus}.`,
//       });
//     }
//     // Update the tournament status
//     const updatedTournament = await prisma.tournament.update({
//       where: { id },
//       data: { status: nextStatus },
//     });
//     return reply.code(200).send({
//       message: "Tournament status updated successfully.",
//       data: updatedTournament,
//     });
//   } catch (error: any) {
//     return reply.code(400).send({
//       message:
//         error.message ||
//         "An error occurred while updating the tournament status.",
//     });
//   }
// }

// // getTournament(s)
// export async function getTournament(
//   request: FastifyRequest,
//   reply: FastifyReply
// ) {
//   try {
//     const { id } = request.params as { id: string };

//     const tournament = await prisma.tournament.findUnique({
//       where: { id },
//       include: {
//         participants: true,
//         rounds: {
//           include: { matches: true },
//           orderBy: { order: "asc" }
//         },
//       },
//     });

//     if (!tournament) {
//       return reply.code(404).send({
//         message: "Tournament not found.",
//       });
//     }

//     return reply.code(200).send({
//       message: "Tournament fetched successfully.",
//       data: tournament,
//     });
//   } catch (error: any) {
//     return reply.code(400).send({
//       message:
//         error.message || "An error occurred while fetching the tournament.",
//     });
//   }
// }
// export async function getTournaments(
//   request: FastifyRequest,
//   reply: FastifyReply
// ) {
//   try {
//     const tournaments = await prisma.tournament.findMany({
//       orderBy: {
//         createdAt: "desc",
//       },
//       include: {
//         participants: true,
//         rounds: {
//           include: { matches: true },
//         },
//       },
//     });

//     return reply.code(200).send({
//       message: "Tournaments fetched successfully.",
//       data: tournaments,
//     });
//   } catch (error: any) {
//     return reply.code(400).send({
//       message: error.message || "An error occurred while fetching tournaments.",
//     });
//   }
// }

// // tournament participants management
// export async function joinTournament(
//   request: FastifyRequest,
//   reply: FastifyReply
// ) {
//   try {
//     const { tournamentId } = request.params as { tournamentId: string };
//     const { participantId } = request.body as { participantId: string };
//     const userId = participantId;

//     const tournament = await prisma.tournament.findUnique({
//       where: { id: tournamentId },
//       include: { participants: true },
//     });

//     // Check if the tournament exists
//     if (!tournament) {
//       return reply.code(404).send({
//         message: "Tournament not found.",
//       });
//     }

//     // check if the tournament is full
//     if (tournament.participants.length >= tournament.maxPlayers) {
//       return reply.code(400).send({
//         message: "Tournament is full.",
//       });
//     }

//     // Check if the user is already a participant
//     if (tournament.participants.some((p) => p.userId === userId)) {
//       return reply.code(400).send({
//         message: "You are already a participant in this tournament.",
//       });
//     }

//     // Check if user exists
//     //TODO I SHOULD FIX THIS LATER.

//     // Add the user to the tournament participants
//     const participant = await prisma.tournamentPlayer.create({
//       data: {
//         tournamentId,
//         userId,
//         isReady: false,
//         isEliminated: false,
//         rankDivision: "Platinum",
//         isVerified: false,
//         avatar:
//           "https://static.wikia.nocookie.net/avatar/images/4/4a/Tom-Tom_tearful.png/revision/latest?cb=20220320160427",
//         firstName: "",
//         lastName: "",
//       },
//     });

//     // Reload tournament participants count
//     const updatedTournament = await prisma.tournament.findUnique({
//       where: { id: tournamentId },
//       include: { participants: true },
//     });

//     // If maxPlayers reached, set status to READY
//     if (
//       updatedTournament &&
//       updatedTournament.participants.length === updatedTournament.maxPlayers
//     ) {
//       await prisma.tournament.update({
//         where: { id: tournamentId },
//         data: { status: TournamentStatus.READY },
//       });
//     }

//     return reply.code(201).send({
//       message: "Joined tournament successfully.",
//       data: participant,
//     });
//   } catch (error: any) {
//     return reply.code(400).send({
//       message:
//         error.message || "An error occurred while joining the tournament.",
//     });
//   }
// }
// export async function leaveTournament(
//   request: FastifyRequest,
//   reply: FastifyReply
// ) {
//   try {
//     const { tournamentId } = request.params as { tournamentId: string };
//     const { participantId } = request.body as { participantId: string };

//     // Check if the tournament exists
//     const tournament = await prisma.tournament.findUnique({
//       where: { id: tournamentId },
//       include: { participants: true },
//     });
//     if (!tournament) {
//       return reply.code(404).send({
//         message: "Tournament not found.",
//       });
//     }

//     // Check if the user is a participant
//     const participant = tournament.participants.find(
//       (p) => p.userId === participantId
//     );
//     if (!participant) {
//       return reply.code(400).send({
//         message: "You are not a participant in this tournament.",
//       });
//     }

//     // if tournament is in progress, eliminate the participant
//     if (tournament.status === TournamentStatus.IN_PROGRESS) {
//       await prisma.tournamentPlayer.update({
//         where: { id: participant.id },
//         data: { isEliminated: true },
//       });
//       return reply.code(200).send({
//         message: "You have been eliminated from the tournament.",
//       });
//       // TODO : make the opponent win the match
//     }

//     // Remove the participant from the tournament
//     await prisma.tournamentPlayer.delete({
//       where: { id: participant.id },
//     });

//     // Reload tournament participants count
//     const updatedTournament = await prisma.tournament.findUnique({
//       where: { id: tournamentId },
//       include: { participants: true },
//     });

//     return reply.code(200).send({
//       message: "Left tournament successfully.",
//       data: updatedTournament,
//     });
//   } catch (error: any) {
//     return reply.code(400).send({
//       message:
//         error.message || "An error occurred while leaving the tournament.",
//     });
//   }
// }

// // Core
// function validateTournamentStatus(status: TournamentStatus) {
//   const statusMessages: Record<TournamentStatus, string> = {
//     [TournamentStatus.REGISTRATION]: "Tournament is still in registration.",
//     [TournamentStatus.READY]: "Tournament is ready.", // Won't be used but needed for type safety
//     [TournamentStatus.IN_PROGRESS]: "Tournament is already in progress.",
//     [TournamentStatus.COMPLETED]: "Tournament is already completed.",
//     [TournamentStatus.CANCELLED]: "Tournament is cancelled.",
//   };

//   if (status !== TournamentStatus.READY) {
//     return statusMessages[status];
//   }
//   return null;
// }
// // Helper function to shuffle array
// function shuffleArray<T>(array: T[]): T[] {
//   return [...array].sort(() => Math.random() - 0.5);
// }
// // Refactored bracket builder
// export function buildBrackets(players: { id: string }[]) {
//   const playerCount = players.length;

//   // Validate power of 2
//   if (playerCount === 0 || (playerCount & (playerCount - 1)) !== 0) {
//     throw new Error(
//       `Player count must be a power of 2. Got ${playerCount} players.`
//     );
//   }

//   const rounds = [];
//   let currentRoundSize = playerCount;
//   let roundPlayers = players.map((p) => p.id);

//   while (currentRoundSize > 1) {
//     const matchCount = Math.floor(currentRoundSize / 2);
//     const matches = [];

//     for (let i = 0; i < matchCount; i++) {
//       matches.push({
//         opponent1Id: roundPlayers[i * 2] || null,
//         opponent2Id: roundPlayers[i * 2 + 1] || null,
//         winnerId: null,
//       });
//     }

//     rounds.push({ matches });
//     currentRoundSize = matchCount;
//     roundPlayers = new Array(matchCount).fill(null);
//   }

//   return { rounds };
// }
// function getRoundName(order: number, totalRounds: number): TournamentRound {
//   const roundNames = [
//     TournamentRound.QUALIFIERS,
//     TournamentRound.ROUND_OF_16,
//     TournamentRound.QUARTER_FINALS,
//     TournamentRound.SEMI_FINALS,
//     TournamentRound.FINAL,
//   ];

//   // Map the order to the correct index from the end
//   const index = roundNames.length - (totalRounds - order + 1);
//   return roundNames[index] || TournamentRound.QUALIFIERS;
// }

// export async function TournamentStart(
//   request: FastifyRequest,
//   reply: FastifyReply
// ) {
//   try {
//     const { id } = request.params as { id: string };

//     const tournament = await prisma.tournament.findUnique({
//       where: { id },
//       include: { participants: true, rounds: { include: { matches: true } } },
//     });

//     if (!tournament)
//       return reply.code(404).send({ message: "Tournament not found." });

//     const statusError = validateTournamentStatus(tournament.status);
//     if (statusError) return reply.code(400).send({ message: statusError });

//     const { participants, maxPlayers } = tournament;
//     if (participants.length !== maxPlayers)
//       return reply.code(400).send({
//         message: `Tournament requires ${maxPlayers} participants, but currently has ${participants.length}.`,
//       });

//     // Shuffle players and assign positions
//     const shuffledPlayers = shuffleArray(participants);
//     await Promise.all(
//       shuffledPlayers.map((player, idx) =>
//         prisma.tournamentPlayer.update({
//           where: { id: player.id },
//           data: { bracketPosition: idx },
//         })
//       )
//     );

//     const totalRounds = Math.log2(maxPlayers);
//     const rounds = [];
//     for (let i = 1; i <= totalRounds; i++) {
//       rounds.push(
//         prisma.tournamentRoundData.create({
//           data: {
//             tournamentId: id,
//             name: getRoundName(i, totalRounds),
//             order: i,
//           },
//         })
//       );
//     }
//     const createdRounds = await Promise.all(rounds);

//     const matches = [];
//     for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
//       const round = createdRounds[roundIndex];
//       const matchesCount = Math.pow(2, totalRounds - roundIndex - 1);

//       for (let i = 0; i < matchesCount; i++) {
//         const opponent1Id = roundIndex === 0 ? shuffledPlayers[i * 2].id : null;
//         const opponent2Id =
//           roundIndex === 0 ? shuffledPlayers[i * 2 + 1].id : null;

//         matches.push({
//           roundId: round.id,
//           opponent1Id: opponent1Id ?? null,
//           opponent2Id: opponent2Id ?? null,
//           status: GameStatus.PENDING,
//           deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
//         });
//       }
//     }

//     await prisma.tournamentMatch.createMany({ data: matches });

//     const updatedTournament = await prisma.tournament.update({
//       where: { id },
//       data: {
//         status: TournamentStatus.IN_PROGRESS,
//         currentRound: TournamentRound.QUALIFIERS,
//       },
//       include: {
//         participants: true,
//         rounds: { include: { matches: true } },
//       },
//     });

//     return reply.code(200).send({
//       message: "Tournament started successfully.",
//       tournament: updatedTournament,
//     });
//   } catch (error: any) {
//     return reply
//       .code(400)
//       .send({ message: error.message || "Failed to start tournament." });
//   }
// }

// export async function reportMatchResult(
//   request: FastifyRequest,
//   reply: FastifyReply
// ) {
//   const { matchId, tournamentId } = request.params as {
//     matchId: string;
//     tournamentId: string;
//   };
//   const { winnerId, loserId, winnerScore, loserScore } = request.body as {
//     winnerId: string;
//     loserId: string;
//     winnerScore: number;
//     loserScore: number;
//   };

//   try {
//     const match = await prisma.tournamentMatch.findUnique({
//       where: { id: matchId },
//       include: { round: true },
//     });

//     if (!match) return reply.code(404).send({ message: "Match not found." });
//     if (match.round.tournamentId !== tournamentId)
//       return reply.code(400).send({ message: "Match does not belong to this tournament." });
//     if (match.status === GameStatus.COMPLETED)
//       return reply.code(400).send({ message: "Match already completed." });

//     if (![match.opponent1Id, match.opponent2Id].includes(winnerId))
//       return reply.code(400).send({ message: "Invalid winner." });
//     if (![match.opponent1Id, match.opponent2Id].includes(loserId))
//       return reply.code(400).send({ message: "Invalid loser." });

//     const result = await prisma.$transaction(async (tx) => {
//       // Update match with winner, loser, and scores
//       const updatedMatch = await tx.tournamentMatch.update({
//         where: { id: matchId },
//         data: {
//           status: GameStatus.COMPLETED,
//           winnerId,
//           opponent1Score: match.opponent1Id === winnerId ? winnerScore : loserScore,
//           opponent2Score: match.opponent2Id === winnerId ? winnerScore : loserScore,
//         },
//       });

//       // Update players
//       await tx.tournamentPlayer.update({
//         where: { id: loserId },
//         data: { isEliminated: true },
//       });

//       await tx.tournamentPlayer.update({
//         where: { id: winnerId },
//         data: { isReady: false },
//       });

//       // Check if all matches in this round are completed
//       const matchesInRound = await tx.tournamentMatch.findMany({
//         where: { roundId: match.roundId },
//       });

//       const allCompleted = matchesInRound.every((m) => m.status === GameStatus.COMPLETED);

//       if (allCompleted) {
//         // Check if tournament is finished
//         const remainingPlayers = await tx.tournamentPlayer.findMany({
//           where: { tournamentId, isEliminated: false },
//         });

//         if (remainingPlayers.length === 1) {
//           await tx.tournament.update({
//             where: { id: tournamentId },
//             data: { status: TournamentStatus.COMPLETED, winnerId: remainingPlayers[0].id },
//           });
//         }
//       }

//       return updatedMatch;
//     });

//     return reply.code(200).send(result);
//   } catch (error: any) {
//     return reply
//       .code(400)
//       .send({ message: error.message || "Error reporting match result." });
//   }
// }

