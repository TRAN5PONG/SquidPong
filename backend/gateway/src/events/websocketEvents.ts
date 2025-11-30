import { sendDataToQueue  } from '../integration/rabbitmq.integration'
import { FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import redis from '../integration/redis.integration';
import { ws } from '../server';
import app from '../app';



// Track a set of WebSocket connections per userId so multiple devices/tabs are supported
export const onlineUsers = new Map<string, Set<WebSocket>>();

async function updatestatus(userId: string , status: 'ONLINE' | 'OFFLINE', updateLastSeen: boolean = false)
{
  const body: any = { status };
  if (updateLastSeen) {
    // instruct user service to update the `lastSeen` timestamp
    body.updateLastSeen = true;
  }

  await fetch(`http://user:4002/api/user/realtime`, { 
    method: "PUT", 
    headers: {
      'x-user-id' : `${userId}`,
      'x-secret-token': process.env.SECRET_TOKEN || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}


export async function handleWsConnect(ws: any, req: FastifyRequest) 
{
  try 
  {
    const userId = ws.userId;
    // add socket to the user's socket set
    const userKey = `${userId}`;
    let sockets = onlineUsers.get(userKey);
    if (!sockets) {
      sockets = new Set<WebSocket>();
      onlineUsers.set(userKey, sockets);
    }
    sockets.add(ws);
    // mark user as online in redis (set membership by userId)
    await redis.sadd('online_users', userId);
    console.log("=======================================")

    ws.on("message", onChatNotificationMessage);
    ws.on("close", () => onClientDisconnect(ws));
    
    
    console.log(` Client connected: ${userId}`);

    await updatestatus(userId, 'ONLINE', false);
    
  }
  catch (error) 
  {
    console.error('WebSocket connection setup failed:', error);
    ws.close(1008, 'Connection setup failed');
  }
}



async function onChatNotificationMessage(this:any , message: any)
{
  try
  {
    const senderId = this.userId;
    const allowedTypes = ['chat', 'notification'  , 'game' , 'tournament'];

    const incomingSocketData = JSON.parse(message.toString());
    if (!incomingSocketData.type) throw new Error('Message type is required');

    console.log("Received message of type:", incomingSocketData);
    if (!allowedTypes.includes(incomingSocketData.type))
      throw new Error(`Invalid message type. Allowed types: ${allowedTypes.join(', ')}`);

    await sendDataToQueue({...incomingSocketData.data , senderId : `${senderId}`} , incomingSocketData.type);
  
  }
  catch (error)
  {
    console.error("Error processing chat-notification message:", error);
  }

}






async function onClientDisconnect(ws: any) 
{
  const userId: string = `${ws.userId}`;

  try 
  {
    const userKey = `${userId}`;
    const sockets = onlineUsers.get(userKey);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) {
        // no more active sockets for this user
        onlineUsers.delete(userKey);
        await redis.srem('online_users', userId);
        console.log(`Client disconnected (last socket): ${userId}`);
        // Update status to OFFLINE and update lastSeen timestamp
        await updatestatus(userId, 'OFFLINE', true);
      } else {
        console.log(`Client disconnected (still active sockets): ${userId}`);
      }
    } else {
      console.log(`Client disconnected but no socket set found for user: ${userId}`);
      // defensively remove from redis and set offline
      await redis.srem('online_users', userId);
      await updatestatus(userId, 'OFFLINE', true);
    }

  }
  catch (error) 
  {
    console.error(`Error handling disconnect for user ${userId}:`, error);
  }
}



export function handleHttpUpgrade(req: any, socket: any, head: any) 
{
  const includesURL = ['/events'];

  try 
  {
    if (!includesURL.includes(req.url)) throw new Error('No endpoint found');
    const token = req.headers.cookie.split('=')[1]
    if (!token) throw new Error('No accessToken found');

    const payload: any = app.jwt.verify(token);

    ws.handleUpgrade(req, socket, head, (client:any) => {
      client.userId = payload.userId;
      ws.emit('connection', client, req);
    });

  } 
  catch (err) 
  {
    console.log("not loged yet  please login first")
    socket.destroy();
  }
}




export function sendWsMessage(msg: any) 
{

  try 
  {

    const data = JSON.parse(msg.content.toString());

    let { to } = data;
    if (!to) return;
    
    to = Array.isArray(to) ? to : [to];

    for (const userId of to) 
    {
      const sockets = onlineUsers.get(`${userId}`);
      if (!sockets || sockets.size === 0) {
        console.log(`User ${userId} is not connected via WebSocket.`);
        continue;
      }

      for (const socket of sockets) {
        try {
          if ((socket as any).readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
          }
        } catch (err) {
          console.error(`Failed sending ws message to user ${userId} socket:`, err);
        }
      }
    }


  } 
  catch (err) 
  {
    console.error("failed to send ws message", err);
  }
}
