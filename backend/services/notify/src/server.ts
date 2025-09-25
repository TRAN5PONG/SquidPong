import dotenv from 'dotenv';
import app from './app'
import { initRabbitMQ , receiveFromQueue } from './integration/rabbitmqClient';

dotenv.config();

const port = Number(process.env.PORT);
const host = process.env.HOST;


async function StartServer()
{
    try 
    {
        app.listen({port : port , host : host} , () => { console.log(`Notify service running at http://notify:${port}`) })
    } 
    catch (error) 
    {
      console.log("Error starting server:", error);
      process.exit(1);
    }
}



async function start() 
{
  await  initRabbitMQ();
  await receiveFromQueue("emailhub")
}
start();