import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";

export async function getLeaderboard(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { limit = "100" } = request.query as { limit?: string };

  console.log("Retrieving leaderboard with limit:", limit);

  try {

    const users = await prisma.user.findMany({
      orderBy: {
        score: "desc",
      },
      take: parseInt(limit),
      include: {
        stats: true,
      },
    });


    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      score: user.score,
      gamesPlayed: user.stats?.gamesPlayed || 0,
      gamesWon: user.stats?.gamesWon || 0,
      gamesLost: user.stats?.gamesLost || 0,
      winRate: user.stats?.gamesPlayed
        ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(2)
        : "0.00",
    }));

    console.log(`Found ${leaderboard.length} users for leaderboard`);

    return reply.status(200).send({
      success: true,
      message: "Leaderboard retrieved successfully",
      data: leaderboard,
    });
  } catch (error) {
    console.error("Error retrieving leaderboard:", error);
    return reply.status(500).send({
      success: false,
      message: "Failed to retrieve leaderboard",
    });
  }
}

export async function getUserRank(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userId } = request.params as { userId: string };

  console.log("Retrieving rank for userId:", userId);

  try {
    const user = await prisma.user.findUnique({
      where: { userId: Number(userId) },
      include: {
        stats: true,
      },
    });

    if (!user) {
      console.log("User not found for userId:", userId);
      return reply
        .status(404)
        .send({ message: "User not found", success: false });
    }


    const usersWithHigherScore = await prisma.user.count({
      where: {
        score: {
          gt: user.score,
        },
      },
    });

    const rank = usersWithHigherScore + 1;

    console.log(`User ${userId} rank: #${rank} with ${user.score} score`);

    return reply.status(200).send({
      success: true,
      message: "User rank retrieved successfully",
      data: {
        rank,
        userId: user.userId,
        score: user.score,
        gamesPlayed: user.stats?.gamesPlayed || 0,
        gamesWon: user.stats?.gamesWon || 0,
        gamesLost: user.stats?.gamesLost || 0,
        winRate: user.stats?.gamesPlayed
          ? ((user.stats.gamesWon / user.stats.gamesPlayed) * 100).toFixed(2)
          : "0.00",
      },
    });
  } catch (error) {
    console.error("Error retrieving user rank:", error);
    return reply.status(500).send({
      success: false,
      message: "Failed to retrieve user rank",
    });
  }
}
