import amqp from "amqplib";

import { sendEmailMessage } from "../utils/verification_messenger";

let connection: any;
let channel: any;


export async function initRabbitMQ() 
{
  connection = await amqp.connect("amqp://rabbitmq:5672");
  channel = await connection.createChannel();
  
  await channel.assertQueue("emailhub");

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



export async function receiveFromQueue(queue: string)
{

  try 
  {
      channel.consume(queue, async (msg:any) =>{

      if (msg !== null)
        {
          const data = JSON.parse(msg.content.toString());
          channel.ack(msg);
          if(queue == "emailhub")
            sendEmailMessage(data)
        }

    });

  }
  catch (err:any) 
  {
    console.error('RabbitMQ error:', err.message);
  }
}



