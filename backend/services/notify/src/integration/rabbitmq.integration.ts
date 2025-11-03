import amqp from "amqplib";
import { processNotificationFromRabbitMQ } from "../controllers/notify.rabbitmq.controller";
import { sendEmailMessage } from "../utils/verification_messenger";


let connection: any;
export let channel: any;

const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

export async function initRabbitMQ() 
{
  try 
  {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    await channel.assertQueue("emailhub" );
    await channel.assertQueue("eventhub" );

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

export async function receiveFromQueue(queue: string) 
{

  try 
  {
    if(queue == "eventhub")
      channel.consume(queue , processNotificationFromRabbitMQ)
    else if(queue == "emailhub")
      channel.consume(queue , sendEmailMessage);
    
  }
  catch (err: any) 
  {
    console.error('RabbitMQ error:', err.message);
  }
}
