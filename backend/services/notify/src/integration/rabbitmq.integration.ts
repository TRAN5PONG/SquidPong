import amqp from "amqplib";

import { sendEmailMessage } from "../utils/verification_messenger";
import { createNotification , updateNotification , deleteNotification } from "../utils/helps";
let connection: any;
let channel: any;

const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

export async function initRabbitMQ() 
{
  try 
  {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    await channel.assertQueue("notification");

    console.log("notify service connected to RabbitMQ");
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

// Consumer function for RabbitMQ

export async function receiveFromQueue() 
{
  const queue = "notification";
  try 
  {
    channel.consume(queue, async (msg: any) => {
    if (!msg) return;
    const data = JSON.parse(msg.content.toString());
    channel.ack(msg);
    if(data.type == 'emailhub')
      sendEmailMessage(data.data);
    
    });
  }
  catch (err: any) 
  {
    console.error('RabbitMQ error:', err.message);
  }
}
