import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";

export async function getPlayerStats(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { playerId } = request.params as { playerId: string };

  console.log("Retrieving stats for playerId:", playerId);

  try {
    const user = await prisma.user.findUnique({
      where: { userId: Number(playerId) },
    });
    if (!user) {
      console.log("User not found for playerId:", playerId);
      return reply
        .status(404)
        .send({ message: "User not found", success: false });
    }

    const stats = await prisma.userStats.findUnique({
      where: { userId: user.id },
    });

    if (!stats) {
      console.log("Player stats not found for playerId:", playerId);
      return reply
        .status(404)
        .send({ message: "Player stats not found", succuss: false });
    } else {
      console.log("Player stats found:", stats);
    }

    return reply.status(200).send({
      success: true,
      message: "Player stats retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error retrieving player stats:", error);
  }
}

export async function getPlayerLastMatches(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { playerId } = request.params as { playerId: string };

  console.log("Retrieving last 5 matches for playerId:", playerId);

  try {
    const user = await prisma.user.findUnique({
      where: { userId: Number(playerId) },
    });

    if (!user) {
      console.log("User not found for playerId:", playerId);
      return reply
        .status(404)
        .send({ message: "User not found", success: false });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { opponent1: { userId: user.id } },
          { opponent2: { userId: user.id } },
        ],
        status: "COMPLETED",
        mode: {
          in: ["ONE_VS_ONE", "TOURNAMENT"],
        },
      },
      include: {
        opponent1: true,
        opponent2: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });


    const matchHistory = matches.map((match) => {
      const isOpponent1 = match.opponent1.userId === user.id;
      const playerData = isOpponent1 ? match.opponent1 : match.opponent2;
      const opponentData = isOpponent1 ? match.opponent2 : match.opponent1;

      const isWinner = playerData?.isWinner || false;
      const opponentUserId = opponentData?.userId || null;
      const opponentUsername = opponentData?.username || "Unknown";
      const playerScore = playerData?.finalScore || 0;
      const opponentScore = opponentData?.finalScore || 0;
      const playerRankChange = playerData?.rankChange || 0;

      return {
        matchId: match.id,
        matchType: match.mode === "ONE_VS_ONE" ? "1v1" : "tournament",
        result: isWinner ? "win" : "loss",
        vsPlayerId: opponentUserId,
        vsPlayerUsername: opponentUsername,
        playerScore: playerScore,
        opponentScore: opponentScore,
        rankChange: playerRankChange,
        createdAt: match.createdAt,
      };
    });

    console.log(`Found ${matchHistory.length} matches for playerId:`, playerId);

    return reply.status(200).send({
      success: true,
      message: "Last matches retrieved successfully",
      data: matchHistory,
    });
  } catch (error) {
    console.error("Error retrieving last matches:", error);
    return reply.status(500).send({
      success: false,
      message: "Failed to retrieve last matches",
    });
  }
}
