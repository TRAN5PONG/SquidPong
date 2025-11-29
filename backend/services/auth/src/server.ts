import app from './app'
import dotenv from 'dotenv'
import { initRabbitMQ } from './integration/rabbitmq.integration'
import { validateEnvironmentVariables } from './utils/envValidator'
import { seedRecommendedPlayers } from './utils/seedUsers'


dotenv.config()

// Validate environment variables before starting
validateEnvironmentVariables()

const port = Number(process.env.AUTH_SERVICE_PORT)
const host = process.env.AUTH_SERVICE_HOST



async function start() 
{
	try 
	{
		console.log(`Starting Auth service on port ${port}...`)
		await app.listen({port , host}, () => { console.log(`Auth service running at http://auth:${port}`) })
	} 
	catch (error) 
	{
		console.log("Error starting server:", error)
		process.exit(1)
	}

	await initRabbitMQ()

	try 
	{
		await seedRecommendedPlayers();
		console.log('Recommended players seeding completed.');
	} 
	catch (err) {
		console.log('Recommended players seeding failed:', err);
	}
}


start()
