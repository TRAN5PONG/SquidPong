import { sendDataToQueue  } from '../integration/rabbitmqClient'
import { FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import redis from '../integration/redisClient';
import { ws } from '../server';
import app from '../app';



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



export const onlineUsers = new Map<string, WebSocket>();





export async function handleWsConnect(ws: any, req: FastifyRequest) 
{
  try 
  {
    const type = req.url === '/game' ? 'game' : 'chat-notification';
    const userId = ws.userId;

    const socketKey = `user:${userId}:sockets:${type}`;
    await redis.set(socketKey, `${ws.userId}`);
    onlineUsers.set(socketKey , ws)
    

    console.log(`User ${userId} connected via ${type} socket (ws.id: ${ws.userId})`);

    // Handle messages per type
    if (type === 'game') 
      ws.on("message", onGameMessage);
    else 
      ws.on("message", onChatNotificationMessage);

    ws.on("close", async () => {
      onClientDisconnect(ws);
    });

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






async function onGameMessage(this:WebSocket , message: any)
{
  
    const dataString: string = Buffer.from(message).toString("utf8");
    const dataJson = JSON.parse(dataString);

    const id = (this as any).userId; 


}



async function onChatNotificationMessage(this:WebSocket , message: any)
{
    const data = JSON.parse(message.toString());

    await sendDataToQueue(data , data.type);

    // if (data.type == "chat")
    //   await sendDataToQueue(data , 'chat');
    // else if (data.type == "notification")
    //   console.log("handler of notification")


}



async function onClientDisconnect(ws: any) 
{
  const userId: string = String(ws.userId);

  try 
  {
    const socketTypes = ['game', 'chat-notification'];
    for (const type of socketTypes) 
    {
      const socketKey = `user:${userId}:sockets:${type}`;
      await redis.del(socketKey);
      onlineUsers.delete(socketKey);

      if (ws.readyState === ws.OPEN)
        ws.close();
    }

    // Notify user-service that user is offline
    sendSingleMultipartVoid( 'http://user:4001/api/user/me', "status", "OFFLINE", userId);

    console.log(`Client ${userId} disconnected (ws.id: ${ws.id})`);
  } 
  catch (error) 
  {
    console.error(`Error handling disconnect for user ${userId}:`, error);
  }
}




export function handleHttpUpgrade(req: any, socket: any, head: any) 
{
  const includesURL = ['/game', '/chat-notification'];

    try 
    {
      if (!includesURL.includes(req.url))
          throw new Error('No endpoint found');

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
