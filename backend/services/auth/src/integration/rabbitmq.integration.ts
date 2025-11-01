import amqp from "amqplib";

let connection: any;
let channel: any;

const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

export async function initRabbitMQ() 
{
  try 
  {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    console.log(" auth service RabbitMQ connected");
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




export async function receiveFromQueue(queue: string) 
{
  channel.consume(queue, receiveAndDeliver);
}



function receiveAndDeliver(msg: any) 
{

  if (msg !== null) 
    {
    sendWsMessage(msg); 
    channel.ack(msg);
    }
}



function sendWsMessage(msg: any) 
{
    const data = JSON.parse(msg.content.toString());

}
