import app from './app'
import dotenv from 'dotenv'
import {initRabbitMQ , receiveFromQueue } from './integration/rabbitmq.integration'
import { validateEnvironmentVariables } from './utils/envValidator'


dotenv.config()

// Validate environment variables before starting
validateEnvironmentVariables()

const port = Number(process.env.CHAT_SERVICE_PORT)
const host = process.env.CHAT_SERVICE_HOST



async function start() 
{
	try 
	{
		await app.listen({port ,  host}, () => { console.log(`chat service running at http://chat:${port}`) })
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
