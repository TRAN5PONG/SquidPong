import Fastify from "fastify";
import { initRabbitMQ, receiveFromQueue } from "./integration/rabbitmqClient";
import { tournamentRoutes } from "./routes/tournamentRoutes";

const server = Fastify({ logger: true });

const start = async () => {
  try {
    // Register CORS plugin inside the async function
    await server.register(import("@fastify/cors"), {
      origin: true,
    });

    // Then register your routes
    server.register(tournamentRoutes);

    await server.listen({ port: 3000, host: "0.0.0.0" });

    await initRabbitMQ();
    await receiveFromQueue("emailhub");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
