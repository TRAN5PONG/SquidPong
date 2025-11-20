import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";
import { CreateMatchBody } from "../types/match";
import { Match, MatchPlayer, Prisma } from "../generated/prisma";
import { User } from "../types/users";
import { sendDataToQueue } from "../integration/rabbitmqClient";
import { getUser } from "../utils/user";

// via socket
export async function TournamentMatch(
  tournamentId: string,
  tournamentMatchId: string,
  opponent1Id: string,
  opponent2Id: string
): Promise<Match> {
  const opponent1User = await getUser(opponent1Id);
  const opponent2User = await getUser(opponent2Id);

  if (!opponent1User || !opponent2User) {
    throw new Error("User not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    const localOpponent1 = await tx.user.upsert({
      where: { userId: opponent1User.userId },
      update: {},
      create: {
        userId: opponent1User.userId,
      },
    });

    const localOpponent2 = await tx.user.upsert({
      where: { userId: opponent2User.userId },
      update: {},
      create: {
        userId: opponent2User.userId,
      },
    });

    const matchPlayer1 = await tx.matchPlayer.create({
      data: {
        userId: localOpponent1.id,
        gmUserId: opponent1User.userId.toString(),
        username: opponent1User.username,
        avatarUrl: opponent1User.avatar,
        characterId: opponent1User.playerSelectedCharacter,
        paddleId: opponent1User.playerSelectedPaddle,
        rankTier: opponent1User.rankTier,
        rankDivision: opponent1User.rankDivision,
      },
    });

    const matchPlayer2 = await tx.matchPlayer.create({
      data: {
        userId: localOpponent2.id,
        gmUserId: opponent2User.userId.toString(),
        username: opponent2User.username,
        avatarUrl: opponent2User.avatar,
        characterId: opponent2User.playerSelectedCharacter,
        paddleId: opponent2User.playerSelectedPaddle,
        rankTier: opponent2User.rankTier,
        rankDivision: opponent2User.rankDivision,
      },
    });

    const match = await tx.match.create({
      data: {
        opponent1Id: matchPlayer1.id,
        opponent2Id: matchPlayer2.id,
        mode: "TOURNAMENT",
        status: "WAITING",
        duration: 0,
        tournamentId,
      },
    });

    await tx.matchSetting.create({
      data: {
        matchId: match.id,
        scoreLimit: 10,
        pauseTime: 90,
        requiredCurrency: 0,
      },
    });

    // link matchId to tournament match
    const isUpdated: any = await fetch(
      `http://tournament:4002/api/tournament/${tournamentId}/matches/${tournamentMatchId}/link`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchId: match.id }),
      }
    );

    if (!isUpdated.success) {
      throw new Error("Failed to link match to tournament match");
    }

    return match;
  });

  return result;
}
// via api endpoint
export async function onTournamentDelete(tournamentId: string) {
  // delete all games related to this tournament
  await prisma.match.deleteMany({
    where: { tournamentId: tournamentId },
  });
}
