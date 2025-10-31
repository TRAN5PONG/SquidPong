import { Server } from "colyseus";
import Fastify from "fastify";

// Create Fastify instance
export const fastify = Fastify({ logger: true });

// Create Colyseus server instance
export const gameServer = new Server({
  server: fastify.server, // ✅ use Fastify's HTTP server
  pingInterval: 4000,
  pingMaxRetries: 3,
});
