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
