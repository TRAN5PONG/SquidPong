import { sendDataToQueue  } from '../integration/rabbitmqClient'
import { FastifyRequest } from "fastify";
import redis from '../integration/redisClient';
import { ws } from '../server';
import type { Socket } from 'net';
import { MyWebSocket } from '../utils/types';

import app from '../app';
import { getUserIdFromRequest } from '../utils/utils';

// Function to send multipart/form-data with a single field
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
    console.error("Error sending multipart data:", err);
  }

}


// Map to keep track of online users and their WebSocket connections
export const onlineUsers = new Map<string, MyWebSocket>();



// Handle new WebSocket connections
export async function handleWsConnect(ws : MyWebSocket) 
{
  try 
  {
    const type = 'chat-notification';
    const userId:string = ws.userId ?? '';

    const socketKey = `user:${userId}:sockets:${type}`;
    await redis.set(socketKey, `${ws.userId}`);
    onlineUsers.set(socketKey , ws)
    
    console.log('WebSocket connection established for user:', userId);

    ws.on("message", onChatNotificationMessage);
    ws.on("close", async () => { onClientDisconnect(ws) });

    
    // Notify user-service that user is online
    await sendSingleMultipartVoid(
      'http://user:4001/api/user/me',
      "status",
      "DO_NOT_DISTURB",
      userId
    );


  } 
  catch (error) 
  {
    console.error('WebSocket connection setup failed:', error);
    ws.close(1008, 'Connection setup failed');
  }
}






// Handle incoming messages for chat and notification
async function onChatNotificationMessage(this:WebSocket , message: any)
{
    const data = JSON.parse(message.toString());

    // Forward the message to RabbitMQ for further processing
    await sendDataToQueue(data , data.type);
}


// Handle client disconnection
async function onClientDisconnect(ws: MyWebSocket) 
{
  const userId: string = ws.userId;

  try 
  {

    const socketKey = `user:${userId}:sockets:chat-notification`;
    await redis.del(socketKey);
    onlineUsers.delete(socketKey);

    if (ws.readyState === ws.OPEN)
      ws.close();

    sendSingleMultipartVoid( 'http://user:4001/api/user/me', "status", "OFFLINE", userId);
    console.log(`WebSocket connection closed for user: ${userId}`);
  } 
  catch (error) 
  {
    console.error(`Error handling disconnect for user ${userId}:`, error);
  }

}



// Handle HTTP upgrade requests to WebSocket
export async function handleHttpUpgrade(req: FastifyRequest, socket: Socket, head: Buffer) 
{
  const includesURL = ['/chat-notification'];

  try 
    {

    if (!includesURL.includes(req.url))
      throw new Error('No endpoint found');

    const userId = await getUserIdFromRequest(req, app);
    

    ws.handleUpgrade(req, socket, head, (client:MyWebSocket) => {
        client.userId = userId;
        ws.emit('connection', client, req);
      });

    } 
    catch (err) 
    {
      console.error('WebSocket upgrade error:', err);
      socket.destroy();
    }

}






async function verifyToken(req:FastifyRequest): Promise<{ userId: string }> 
{
  try 
  {
    const cookie = req.headers.cookie;
    const token = cookie ? cookie.split('=')[1] : undefined;

    if (!token) throw new Error('No accessToken found');

    const payload = app.jwt.verify<{ userId: string }>(token);
    return payload;
  } 
  catch (err) 
  {
    throw new Error('Invalid token');
  }
}




// Send WebSocket message to specific users
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
      
    const socketKey = `user:${userId}:sockets:chat-notification`;
    const socket = onlineUsers.get(socketKey);

    if (!socket)
    {
      console.log(`User ${userId} not online`);
      continue;
    }

    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify(data));
  }


  } 
  catch (err) 
  {
    console.error("Failed to send WS message:", err);
  }
}
