import amqp from "amqplib";

let connection: any;
let channel: any;


export async function initRabbitMQ() 
{
  connection = await amqp.connect("amqp://rabbitmq:5672");
  channel = await connection.createChannel();
  
  await channel.assertQueue("friend");
  await channel.assertQueue("chat");
  await channel.assertQueue("emailhub");
  await channel.assertQueue("chatservice");

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