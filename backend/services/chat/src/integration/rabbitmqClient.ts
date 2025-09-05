import amqp from "amqplib";
import { addMessage } from "../db.js";

let connection: any;
let channel: any;


export async function initRabbitMQ() 
{
  connection = await amqp.connect("amqp://rabbitmq:5672");
  channel = await connection.createChannel();
  
  await channel.assertQueue("chat");

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
  const queue = 'chat';
  channel.consume(queue, receiveAndDeliver);
}


function receiveAndDeliver(msg: any) 
{


  if (msg !== null) 
  {
    channel.ack(msg);
    const data = JSON.parse(msg.content.toString());
    console.log(data)
    addMessage(data.senderId , data.message , data.receiverId);
    sendDataToQueue({message : data.message , to : data.receiverId} , 'test')

  }
}




// function sendWsMessage(msg: any) 
// {
//     const data = JSON.parse(msg.content.toString());

//     ws.clients.forEach((client: any) => {
//     if (client.userId == data.to) client.send(JSON.stringify(data));
//   });

// }

