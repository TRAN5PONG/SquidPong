import amqp from "amqplib";
import {ws} from "../server";

import { onlineUsers } from "../events/websocketEvents";


let connection: any;
let channel: any;


const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

export async function initRabbitMQ() 
{
  try 
  {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    await channel.assertQueue("broadcastData");

    console.log("gateway connected to RabbitMQ");
  } 
  catch (err) {
    console.error("Failed to connect to RabbitMQ, retrying in 5s:", err);
    setTimeout(() => { initRabbitMQ()}, 5000);
  }
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
    const userKey = `${userId}`;
    const sockets = onlineUsers.get(userKey);

    if (!sockets || sockets.size === 0) {
      console.log(`User ${userId} is offline or socket not available`);
      return;
    }

    // Send to all sockets for this user (multi-device support)
    sockets.forEach((clientWs) => {
      try {
        if ((clientWs as any).readyState === (clientWs as any).OPEN) 
        {
          console.log("Sending to client UserID:", userId);
          clientWs.send(JSON.stringify(data)); // send full data object
        }
      } catch (err) {
        console.error(`Failed to send message to user ${userId}:`, err);
      }
    });
  });

  channel.ack(msg);
}
