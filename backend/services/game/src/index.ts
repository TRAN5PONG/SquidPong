import dotenv from "dotenv";
import Fastify from "fastify";
import { matchRoutes } from "./routes/matchRoutes";
import { invitationRoutes } from "./routes/invitationRoutes";
import { initRabbitMQ, receiveFromQueue } from "./integration/rabbitmqClient";
import { Server } from "colyseus";
import cors from "@fastify/cors";
import { PingPongRoom } from "./rooms/PingPongRoom";

dotenv.config();

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
const fastify = Fastify({ logger: true });

// =============================
// Colyseus Game Server Instance
// =============================
const gameServer = new Server({
  server: fastify.server, // ✅ Use Fastify's built-in HTTP server
  pingInterval: 4000,     // ✅ Optional: better control over WS heartbeat
  pingMaxRetries: 3,
});

const start = async () => {
  try {
    // ============================
    // 1. Register Middlewares
    // ============================
    await fastify.register(cors, { origin: true });

    // ============================
    // 2. Register REST Routes
    // ============================
    fastify.register(matchRoutes);
    fastify.register(invitationRoutes);

    // ============================
    // 3. Initialize RabbitMQ
    // ============================
    await initRabbitMQ();
    await receiveFromQueue("game");

    // ============================
    // 4. Register Colyseus Rooms
    // ============================
    gameServer.define("ping-pong", PingPongRoom);

    // ============================
    // 5. Start Fastify + Colyseus
    // ============================
    await fastify.listen({ port, host });
    console.log(`✅ Game Service ready at http://${host}:${port}`);
    console.log(`🎮 Colyseus WebSocket ready at ws://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// =============================
// Graceful Shutdown
// =============================
const shutdown = async () => {
  try {
    // Close Fastify HTTP server
    await fastify.close();
    // Close Colyseus explicitly (cleans up rooms & connections)
    await gameServer.gracefullyShutdown();
    console.log("✅ Game server stopped.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
