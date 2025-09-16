import amqp from "amqplib";


let connection: any;
let channel: any;


export async function initRabbitMQ() 
{
  connection = await amqp.connect("amqp://rabbitmq:5672");
  channel = await connection.createChannel();
  
  await channel.assertQueue("friends");

  console.log("RabbitMQ connected");
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
      console.log("user-service ==> Received message from queue:", data);
      channel.ack(msg);
    }

  });
  }
  catch (err:any) 
  {
    console.log("Error in rabbit connection:", err.message);
  }
}



