import prisma from "../db/database";
import { channel } from "../integration/rabbitmqClient";
import { sendDataToQueue } from "../integration/rabbitmqClient";

export async function sayhello(req: any, res: any) 
{
    res.send({message: "hello from chat service"});
}



export async function createMessage(senderId: string, receiverId: string, message: string) 
{
  return prisma.message.create({
    data: {
      senderId,
      receiverId,
      message
    }
  });
}



export async function getMessages(senderId: string, receiverId: string) 
{
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    },
    include: {
      reactions: true
    },
    orderBy: { timestamp: 'asc' }
  });
}



export async function addOrUpdateReaction(userId: string, messageId: number, emoji: string) 
{
  const existingReaction = await prisma.reaction.findFirst({
    where: { userId, messageId }
  });

  if (existingReaction) 
    {
    if (existingReaction.emoji !== emoji) 
    {
      return prisma.reaction.update({
        where: { id: existingReaction.id },
        data: { emoji, timestamp: new Date() }
      });
    }
    else
      return existingReaction;
    }

    // Add new reaction
    return prisma.reaction.create({
      data: { userId, messageId, emoji }
    });

}



export async function removeReaction(userId: string, messageId: number) 
{
  const existingReaction = await prisma.reaction.findFirst({
    where: { userId, messageId }
  });

  if (!existingReaction) return null;

  return prisma.reaction.delete({
    where: { id: existingReaction.id }
  });
}







export async function processChatMessageFromRabbitMQ(msg: any)
{
    const data = JSON.parse(msg.content.toString());

    console.log("Processing message in chat service:", data);
    if (data === null) return;

    const msgType = data.type;

    switch (msgType)
    {
        case "create-message":
            await createMessage(`${data.senderId}`, data.receiverId, data.message);
            await sendDataToQueue({message : "hello test from chat servcies" , targetId : data.receiverId}, "broadcastData");
            break;

        case "get-messages":
            const messages = await getMessages(data.senderId, data.receiverId);
            // Here you would typically send the messages back to the requester via another queue or a websocket
            console.log("Fetched messages:", messages);
            break;

        case "add-or-update-reaction":
            await addOrUpdateReaction(data.senderId, data.messageId, data.emoji);
            break;

        case "remove-reaction":
            await removeReaction(data.senderId, data.messageId);
            break;

        default:
            console.log("Unknown message type:", msgType);
    }

    channel.ack(msg);
}
