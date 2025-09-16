import dotenv from 'dotenv';
import app from './app'
import { initRabbitMQ , receiveFromQueue } from './integration/rabbitmqClient';
dotenv.config();

const port = Number(process.env.PORT);
const host = process.env.HOST;


async function fastifyserver()
{

    try 
    {
        app.listen({port : port , host : host} , () => {console.log(`user service running at http://user:${port} ...`)})
    } 
    catch (error) 
    {
        console.log("Error starting server:", error);
        process.exit(1);
    }
}


async function start() 
{
    
    fastifyserver();
    await initRabbitMQ();
    await receiveFromQueue("friends");
}

start();