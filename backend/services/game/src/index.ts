import dotenv from "dotenv";
import { fastify, gameServer } from "./colyseus";
import { matchMaker } from "colyseus";
import { matchRoutes } from "./routes/matchRoutes";
import { invitationRoutes } from "./routes/invitationRoutes";
import { initRabbitMQ, receiveFromQueue } from "./integration/rabbitmqClient";
import cors from "@fastify/cors";
import { PingPongRoom } from "./rooms/PingPongRoom";
import { prisma } from "./lib/prisma";

dotenv.config();

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

async function recreateActiveRooms() {
  console.log("🔄 Checking for active matches to recreate rooms...");

  try {
    const activeMatches = await prisma.match.findMany({
      where: {
        status: {
          in: ["WAITING", "IN_PROGRESS"],
        },
        roomId: { not: null },
      },
      include: {
        opponent1: true,
        opponent2: true,
      },
    });

    if (activeMatches.length === 0) {
      console.log("✅ No active matches found that need room recreation");
      return;
    }

    console.log(
      `🎮 Found ${activeMatches.length} active matches, recreating rooms...`
    );

    for (const match of activeMatches) {
      try {
        const room = await matchMaker.createRoom("ping-pong", {
          matchId: match.id,
          players: [match.opponent1.userId, match.opponent2?.userId],
          spectators: [],
        });

        await prisma.match.update({
          where: { id: match.id },
          data: { roomId: room.roomId },
        });

        console.log(`✅ Recreated room for match ${match.id}: ${room.roomId}`);
      } catch (error) {
        console.error(
          `❌ Failed to recreate room for match ${match.id}:`,
          error
        );

        // Clear the roomId if recreation fails
        await prisma.match.update({
          where: { id: match.id },
          data: { roomId: null },
        });
      }
    }
  } catch (error) {
    console.error("❌ Error during room recreation:", error);
  }
}

const start = async () => {
  try {
    // Register CORS
    await fastify.register(cors, { origin: true });

    // Register routes
    fastify.register(matchRoutes);
    fastify.register(invitationRoutes);

    // Init RabbitMQ
    await initRabbitMQ();
    await receiveFromQueue("game");

    // Register Colyseus rooms
    gameServer.define("ping-pong", PingPongRoom);

    // Recreate rooms for existing matches (dev mode)
    if (process.env.NODE_ENV === "development") {
      console.log("🔧 Development mode: Recreating active rooms");
      await recreateActiveRooms();
    } else {
      console.log("⚠️ Skipping room recreation in production mode");
    }

    // Start Fastify + Colyseus
    await fastify.listen({ port, host });
    console.log(`✅ Game Service ready at http://${host}:${port}`);
    console.log(`🎮 Colyseus WebSocket ready at ws://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
