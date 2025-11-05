import { sendDataToQueue  } from '../integration/rabbitmq.integration'
import { FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import redis from '../integration/redis.integration';
import { ws } from '../server';
import app from '../app';


export const onlineUsers = new Map<string, WebSocket>();



// helper function to send a single field in multipart/form-data format

async function sendSingleMultipartVoid(url: string, fieldName: string, value: string | File | Blob , userId : string )
{
  const formData = new FormData();
  formData.append(fieldName, value);

  try 
  {
    await fetch(url, { method: "PUT", body: formData , headers: { "x-user-id": userId}});
  }
  catch (err) 
  {
    console.error(`Failed to send status update to ${url}:`, err);
  }

}



async function updatestatus(userId: number )
{
  await fetch(`http://user:4002/api/user/me`, { headers: { "x-user-id": `userId` }});


  await sendSingleMultipartVoid(
    'http://user:4002/api/user/live',
    "status",
    "ONLINE",
    userId.toString()
    );

  await fetch(`http://user:4002/api/user/sync`, {
    method: "POST",
    headers: {
      'x-secret-token': process.env.SECRET_TOKEN || '',
      "Content-Type": "application/json",
      "x-user-id": userId.toString(),
    },
    body: JSON.stringify({status : "ONLINE"}),
    });
    
}

// end helper function






export async function handleWsConnect(ws: any, req: FastifyRequest) 
{
  try 
  {
    const userId = ws.userId;
    const socketKey = `socket:${userId}`;
    onlineUsers.set(socketKey , ws)
    await redis.sadd('online_users', userId);


    ws.on("message", onChatNotificationMessage);
    ws.on("close", () => onClientDisconnect(ws));
    
    
    console.log(`Client connected: ${userId}`);
    await updatestatus(userId);
    
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
    const allowedTypes = ['chat', 'notification'  , 'game'];

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

    if (ws.readyState === ws.OPEN)
      ws.close();

    onlineUsers.delete(`socket:${userId}`);
    await redis.srem('online_users', userId);

    console.log(`Client disconnected: ${userId}`);
    

    await sendSingleMultipartVoid('http://user:4002/api/user/live', "status", "OFFLINE", userId);
    await fetch(`http://user:4002/api/user/sync`, {
    method: "POST",
    headers: {
      'x-secret-token': process.env.SECRET_TOKEN || '',
      "Content-Type": "application/json",
      "x-user-id": userId.toString(),
    },
    body: JSON.stringify({status : "OFFLINE"}),
    });


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
      
    const socketKey = `socket:${userId}`;
    const socket = onlineUsers.get(socketKey);

    if (!socket)
    {
      console.log(`User ${userId} is not connected via WebSocket.`);
      continue;
    }

    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify(data));
  }


  } 
  catch (err) 
  {
    console.error("failed to send ws message", err);
  }
}
