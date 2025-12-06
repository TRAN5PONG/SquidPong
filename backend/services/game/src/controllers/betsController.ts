// | **Route**                | **Method** | **Description**                                                |
// | ------------------------ | ---------- | -------------------------------------------------------------- |
// | `/matches/:matchId/bets` | `GET`      | Get all bets for a match.                                      |
// | `/matches/:matchId/bet`  | `POST`     | Place a bet on a match. Body: `{ amount, predictedWinnerId }`. |
// | `/bets/:betId`           | `GET`      | Get details of a specific bet.                                 |
// | `/bets/:betId/cancel`    | `POST`     | Cancel a pending bet (before match starts).                    |

import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma";


// FIXED: req should be FastifyRequest, reply should be FastifyReply
export const getBetsForMatch = async (req: FastifyRequest, reply: FastifyReply) => {
  const { matchId } = (req.params as any);

  const bets = await prisma.bet.findMany({
    where: { matchId },
  });

  if (bets.length === 0) {
    return reply
      .status(404)
      .send({ message: "No bets found for this match.", success: false });
  }

  reply.send({
    message: "Bets retrieved successfully.",
    success: true,
    data: bets,
  });
};

export const placeBet = async (req: FastifyRequest, reply: FastifyReply) => {
  const { matchId } = (req.params as any);
  const { amount, predictedWinnerId } = (req.body as any);
  const userIdHeader = req.headers["x-user-id"] as string;

  if (!userIdHeader) {
    return reply.status(400).send({ 
      message: "User ID is required.", 
      success: false 
    });
  }

  // First, check if user exists
  const user = await prisma.user.findUnique({
    where: { userId: Number(userIdHeader) } // userId is Int in schema
  });

  if (!user) {
    return reply.status(404).send({ 
      message: "User not found.", 
      success: false 
    });
  }

  // Check if match exists
  const match = await prisma.match.findUnique({
    where: { id: matchId }
  });

  if (!match) {
    return reply.status(404).send({ 
      message: "Match not found.", 
      success: false 
    });
  }

  // Check if predictedWinner exists (if it's a MatchPlayer)
  if (predictedWinnerId) {
    const matchPlayer = await prisma.matchPlayer.findUnique({
      where: { id: predictedWinnerId }
    });

    if (!matchPlayer) {
      return reply.status(404).send({ 
        message: "Predicted winner not found.", 
        success: false 
      });
    }
  }

  try {
    const bet = await prisma.bet.create({
      data: {
        matchId,
        amount,
        predictedWinnerId,
        userId: user.id, // Use the User's cuid, not the GM userId
      },
    });

    reply.status(201).send({
      message: "Bet placed successfully.",
      success: true,
      data: bet,
    });
  } catch (error) {
    console.error("Error creating bet:", error);
    return reply.status(500).send({ 
      message: "Failed to place bet.", 
      success: false 
    });
  }
};

export const getBetDetails = async (req: FastifyRequest, reply: FastifyReply) => {
  const { betId } = (req.params as any);

  const bet = await prisma.bet.findUnique({
    where: { id: betId },
  });

  if (!bet) {
    return reply.status(404).send({ message: "Bet not found.", success: false });
  }

  reply.send({
    message: "Bet details retrieved successfully.",
    success: true,
    data: bet,
  });
};

export const cancelBet = async (req: FastifyRequest, reply: FastifyReply) => {
  const { betId } = (req.params as any);

  const bet = await prisma.bet.findUnique({
    where: { id: betId },
  });

  if (!bet) {
    return reply.status(404).send({ message: "Bet not found.", success: false });
  }

  if (bet.status !== "PENDING") {
    return reply
      .status(400)
      .send({ message: "Only pending bets can be canceled.", success: false });
  }

  const canceledBet = await prisma.bet.update({
    where: { id: betId },
    data: { status: "CANCELLED" },
  });

  reply.send({
    message: "Bet canceled successfully.",
    success: true,
    data: canceledBet,
  });
};