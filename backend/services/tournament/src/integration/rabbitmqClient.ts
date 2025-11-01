import amqp from "amqplib";

import { sendEmailMessage } from "../utils/verification_messenger";

let connection: any;
let channel: any;


const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

export async function initRabbitMQ() 
{
  try {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    await channel.assertQueue("emailhub");

    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.error("Failed to connect to RabbitMQ, retrying in 5s:", err);
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      initRabbitMQ();
    }, 5000);
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



