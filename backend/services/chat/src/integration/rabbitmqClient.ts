import amqp from "amqplib";
import { processChatMessageFromRabbitMQ } from "../controllers/chat.rabbit.controller";
let connection: any;
export let channel: any;


export async function initRabbitMQ() 
{
  connection = await amqp.connect("amqp://rabbitmq:5672");
  channel = await connection.createChannel();

  await channel.assertQueue("chat");
  
  console.log("chat service connected to RabbitMQ");
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
  const queue = "chat";
  channel.consume(queue, processChatMessageFromRabbitMQ);
}

