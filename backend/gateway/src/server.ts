import app from './app'
import { WebSocket } from "ws";
import dotenv from 'dotenv'
import { handleWsConnect  , handleHttpUpgrade} from './events/websocketEvents';
import { receiveFromQueue , initRabbitMQ } from './integration/rabbitmqClient'


dotenv.config()

const port = Number(process.env.PORT)
const host = process.env.HOST



async function start() 
{
	try 
	{
		app.listen({port: port, host: host}, () => { console.log(`gateway service running at http://gateway:${port}`) })
	} 
	catch (error) 
	{
		console.log('error in server')
		process.exit(1)
	}

	await initRabbitMQ()
	await receiveFromQueue()
}



export const ws = new WebSocket.Server({noServer: true})

app.server.on('upgrade',handleHttpUpgrade);
ws.on('connection', handleWsConnect);


start()
