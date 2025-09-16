import app from './app'
import dotenv from 'dotenv'
import {initRabbitMQ } from './integration/rabbitmqClient'


dotenv.config()

const port = Number(process.env.PORT)
const host = process.env.HOST



async function start() 
{
	try 
	{
		app.listen({port: port, host: host}, () => { console.log(`Auth service running at http://auth:${port}`) })
	} 
	catch (error) 
	{
		console.log("Error starting server:", error)
		process.exit(1)
	}

	await initRabbitMQ()
}



start()
