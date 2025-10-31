import amqp from "amqplib";
import {ws} from "../server";

import { onlineUsers } from "../events/websocketEvents";


let connection: any;
let channel: any;




export async function initRabbitMQ() 
{
  connection = await amqp.connect("amqp://rabbitmq:5672");
  channel = await connection.createChannel();
  
  await channel.assertQueue("broadcastData");

  console.log("Connected to RabbitMQ");
}


export async function sendDataToQueue(data: any, queue: string) 
{
  try 
  {
    const msgBuffer = Buffer.from(JSON.stringify(data));
    channel.sendToQueue(queue, msgBuffer);
  } 
  catch (error) 
  {
    console.log("Error in rabbit connection:", error);
  }
}




export async function receiveFromQueue() 
{
  const queue = "broadcastData";
  channel.consume(queue, sendWsMessage);
}




function sendWsMessage(msg: any) 
{
  let data;

  if (!msg) return;

  try 
  {
    data = JSON.parse(msg.content.toString());
  } 
  catch (err) {
    console.error("Invalid JSON:", err);
    return;
  }

  console.log("Broadcasting message to WebSocket clients:", data);

  const targetIds = Array.isArray(data.targetId) ? data.targetId : [data.targetId];
  console.log("Target IDs:", targetIds);

  targetIds.forEach((userId: string) => {
    const socketKey = `socket:${userId}`;
    const clientWs = onlineUsers.get(socketKey);

    if (clientWs && clientWs.readyState === clientWs.OPEN) 
      {
      console.log("Sending to client UserID:", userId);
      clientWs.send(JSON.stringify(data)); // send full data object
    } 
    else
      console.log(`User ${userId} is offline or socket not available`);
  });

  // Acknowledge the message in the queue
  channel.ack(msg);
}
