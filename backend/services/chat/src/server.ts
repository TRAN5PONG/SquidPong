import app from './app'
import dotenv from 'dotenv'
import {initRabbitMQ , receiveFromQueue } from './integration/rabbitmq.integration'


dotenv.config()

const port = Number(process.env.CHAT_SERVICE_PORT)
const host = process.env.CHAT_SERVICE_HOST



async function start() 
{
	try 
	{
		app.listen({port ,  host}, () => { console.log(`chat service running at http://chat:${port}`) })
	} 
	catch (error) 
	{
		console.log("Error starting server:", error)
		process.exit(1)
	}

	await initRabbitMQ();
	await receiveFromQueue();
}



start()
