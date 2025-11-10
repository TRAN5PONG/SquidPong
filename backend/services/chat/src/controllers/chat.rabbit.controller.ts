import prisma from "../db/database";
import { channel } from "../integration/rabbitmq.integration";
import { sendDataToQueue } from "../integration/rabbitmq.integration";
import { checkChatMembershipAndGetOthers } from "../utils/chat";

// import { handleMessage } from "../utils/process.message";


export enum ReactionType {
  LIKE    = "LIKE",     // 👍
  LOVE    = "LOVE",     // ❤️
  LAUGH   = "LAUGH",    // 😂
  SAD     = "SAD",      // 😢
  ANGRY   = "ANGRY",    // 😡
  WOW     = "WOW",      // 😮
  FUCK    = "FUCK",     // 

}



export enum MessageType 
{
  USER_TYPING       = "user-typing",
}







export async function isTypingRecord(senderId : string , isTyping: boolean)
{
  const dataToSend = {
      type: "userTyping",
      fromId: senderId,
      data : {isTyping},
    };
  return dataToSend;
}



export async function processChatMessageFromRabbitMQ(msg: any)
{
  let respond;

  try 
  {
    const data = JSON.parse(msg.content.toString());
    if (data === null) throw new Error("Received null data from RabbitMQ");
    
    const { type, chatId, senderId , isTyping} = data;
    const { targetId } = await checkChatMembershipAndGetOthers(Number(chatId), Number(senderId));

    switch(type) {

      case MessageType.USER_TYPING:
        respond = await isTypingRecord(senderId.toString() , Boolean(isTyping));
        break;

      default:
        console.warn(`Unknown message type: ${type}`);
        channel.ack(msg);
        return;
    }

    await sendDataToQueue({ ...respond, targetId }, "eventhub");
    channel.ack(msg);
  }
  catch (error) 
  {
    console.error("Error processing message in chat service:", error);
    channel.nack(msg, false, false); // Discard the message on error
  }
}

