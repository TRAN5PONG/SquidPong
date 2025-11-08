import dotenv from 'dotenv';
import app from './app'
import { initRabbitMQ , receiveFromQueue } from './integration/rabbitmq.integration';
import { validateEnvironmentVariables } from './utils/envValidator';

dotenv.config();

// Validate environment variables before starting
validateEnvironmentVariables();

const port = Number(process.env.NOTIFY_SERVICE_PORT);
const host = process.env.NOTIFY_SERVICE_HOST;


async function StartServer()
{
    try 
    {

    await app.listen({port  , host } , () => { console.log(`Notify service running at http://notify:${port}`) })
    await initRabbitMQ();
    await receiveFromQueue("emailhub");
    await receiveFromQueue("eventhub");
  
    } 
    catch (error) 
    {
      console.log("Error starting server:", error);
      process.exit(1);
    }
}


StartServer();
