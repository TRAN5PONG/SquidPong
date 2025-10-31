import dotenv from 'dotenv';
import app from './app'
import { initRabbitMQ , receiveFromQueue } from './integration/rabbitmq.integration';

dotenv.config();

const port = Number(process.env.NOTIFY_SERVICE_PORT);
const host = process.env.NOTIFY_SERVICE_HOST;


async function StartServer()
{
    try 
    {

    app.listen({port  , host } , () => { console.log(`Notify service running at http://notify:${port}`) })
    await initRabbitMQ();
    await receiveFromQueue()
  
    } 
    catch (error) 
    {
      console.log("Error starting server:", error);
      process.exit(1);
    }
}


StartServer();
