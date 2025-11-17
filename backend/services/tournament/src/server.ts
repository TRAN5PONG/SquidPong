import dotenv from 'dotenv';
import app from './app';
import { initRabbitMQ, receiveFromQueue } from './integration/rabbitmqClient';

dotenv.config();

const PORT = Number(process.env.PORT ?? process.env.TOURNAMENT_SERVICE_PORT ?? 3002);
const HOST = process.env.HOST ?? process.env.TOURNAMENT_SERVICE_HOST ?? '0.0.0.0';

async function start() 
{
  try 
  {
    console.log(`Starting Tournament service on port ${PORT}...`);
    await app.listen({ port: PORT, host: HOST });
  } 
  catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }

  await initRabbitMQ();
  await receiveFromQueue();
}

start();
