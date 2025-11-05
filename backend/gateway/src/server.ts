import app from './app'
import { WebSocket } from "ws";
import dotenv from 'dotenv'
import { handleWsConnect  , handleHttpUpgrade} from './events/websocketEvents';
import { receiveFromQueue , initRabbitMQ } from './integration/rabbitmq.integration'


dotenv.config()

const port = Number(process.env.GATEWAY_PORT) // 4000
const host = process.env.GATEWAY_HOST // 0.0.0.0 



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
