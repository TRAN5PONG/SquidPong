import amqp from "amqplib";
import { processChatMessageFromRabbitMQ } from "../controllers/chat.rabbit.controller";
let connection: any;
export let channel: any;


export async function initRabbitMQ() 
{
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

  try 
  {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    await channel.assertQueue("chat");
    await channel.assertQueue("broadcastData");

    console.log("Chat service connected to RabbitMQ");
  } 
  catch (err) 
  {
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
  const queue = "chat";
  channel.consume(queue, processChatMessageFromRabbitMQ);
}
