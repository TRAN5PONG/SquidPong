import prisma from "../db/database";
import { channel } from "../integration/rabbitmqClient";
import { sendDataToQueue } from "../integration/rabbitmqClient";
import { checkChatMembershipAndGetOthers } from "../utils/chat";

// import { handleMessage } from "../utils/process.message";


export enum ReactionType {
  LIKE    = "LIKE",     // 👍
  LOVE    = "LOVE",     // ❤️
  LAUGH   = "LAUGH",    // 😂
  SAD     = "SAD",      // 😢
  ANGRY   = "ANGRY",    // 😡
  WOW     = "WOW",      // 😮

  // Premium
  FIRE    = "FIRE",     // 🔥
  DIAMOND = "DIAMOND",  // 💎
  MONEY   = "MONEY",    // 🤑
  STAR    = "STAR"      // ⭐
}

enum typeofChat {
   PRIVATE = 'PRIVATE',
   GROUP = 'GROUP',
}

const { PRIVATE , GROUP } = typeofChat ;

export enum MessageType 
{

  // --- Persisted ---
  PRIVATE_MESSAGE   = "private-message",
  GROUP_MESSAGE     = "group-message",
  EDIT_MESSAGE      = "edit-message",
  DELETE_MESSAGE    = "delete-message",
  REPLY_MESSAGE     = "reply-message",

  ADD_REACTION      = "add-reaction",
  REMOVE_REACTION   = "remove-reaction",

  CREATE_POLL       = "create-poll",
  VOTE_POLL         = "vote-poll",
  CLOSE_POLL        = "close-poll",

  // --- Ephemeral ---
  USER_TYPING       = "user-typing",

}



export async function CreateMessageRecord(chatId : number , senderId : string  ,  content  : string )
{
  await prisma.message.create({
    data: {
      chatId,
      content,
      senderId
    },
  });
  return { content };
}



async function AddORUpdateReactionRecord(messages : [] ,  messageId: number , emoji : ReactionType , userId : string)
{
  const message:any = messages.find((m:any) => m.id === messageId);
  if (!message) throw new Error("Message not found");

  await prisma.reaction.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId
      },
    },
    update: { emoji },
    create: { messageId, userId, emoji },
  });

  return {emoji};
}


async function RemoveReactionRecord(messages : [],  messageId: number , userId: string)
{
  const message:any = messages.find((m:any) => m.id === messageId);
  if (!message) throw new Error("Message not found");

  await prisma.reaction.delete({
    where: {
      messageId_userId: {
        messageId: Number(messageId),
        userId : userId,
      },
    },
  });
  
  return {removedReactionMessageId : messageId};

}    


export async function editMessageRecord(messages : [] ,  messageId : number , newContent : string , userId : string)
{
  const message:any = messages.find((m:any) => m.id === messageId);
    if (!message) throw new Error("Message not found");
  
  if(message.senderId !== userId) throw new Error("Only the sender can edit the message");
  
  await prisma.message.update({
    where: { id:messageId },
    data: { content: newContent , isEdited: true },
  });

  return {editedMessageId : messageId , newContent};
}


export async function deleteMessageRecord(messages : [] ,  messageId : number , userId : string)
{
  const message:any = messages.find((m:any) => m.id === messageId);
    if (!message) throw new Error("Message not found");
  
  if(message.senderId !== userId) throw new Error("Only the sender can delete the message");
  
  await prisma.message.delete({ where: { id:messageId } });

  return {deletedMessageId : messageId};
}


export async function replyMessageRecord(messages : [] ,  messageId : number , replyContent : string , userId : string)
{
  const message:any = messages.find((m:any) => m.id === messageId);
    if (!message) throw new Error("Message not found");
  
  const replyMessage = await prisma.message.create({
    data: {
      chatId : message.chatId,
      content: replyContent,
      senderId: userId,
      replyToId: messageId,
    },
  });
  
  return {replyMessage};

}



export async function forwardMessageRecord(data: any)
{
  const { originalMessageId, newChatId , senderId } = data;

  const originalMessage = await prisma.message.findUnique({ where: { id: Number(originalMessageId) } });
    if (!originalMessage) throw new Error("Original message not found");

  const newChat = await prisma.chat.findUnique({ where: { id: Number(newChatId) } , include: { members: true } });
    if (!newChat) throw new Error("New chat not found");

  const isMember = newChat.members.some((m:any) => m.userId === senderId);
    if (!isMember) throw new Error("User is not a member of the new chat");

  const forwardedMessage = await prisma.message.create({
    data: {
      chatId : Number(newChatId),
      content: originalMessage.content,
      senderId,
    },
  });

  const targetId = newChat.members.filter((m:any) => m.userId !== senderId).map((m:any) => m.userId);
  
  console.log("Sending forwarded message to queue:", {message : originalMessage.content , targetId});
  await sendDataToQueue( {message : originalMessage.content , targetId} , "broadcastData" );

  return forwardedMessage;

}



export async function isTypingRecord(isTyping: boolean)
{

  return {isTyping};
}



export async function processChatMessageFromRabbitMQ(msg: any)
{
  let respond;

  try 
  {
    const data = JSON.parse(msg.content.toString());
    if (data === null) throw new Error("Received null data from RabbitMQ");
    
    const { type , chatId , senderId , content , reaction , messageId , isTyping } = data;
    const {targetId , chat} = await checkChatMembershipAndGetOthers(Number(chatId), Number(senderId));

    

    if( type === MessageType.PRIVATE_MESSAGE || type === MessageType.GROUP_MESSAGE )
      respond = await CreateMessageRecord(Number(chatId), String(senderId), String(content) );
    else if( type === MessageType.ADD_REACTION )
      respond = await AddORUpdateReactionRecord(chat.messages as any , Number(messageId), reaction as ReactionType , senderId);
    else if( type === MessageType.REMOVE_REACTION )
      respond = await RemoveReactionRecord(chat.messages as any , Number(messageId) , senderId);
    else if( type === MessageType.EDIT_MESSAGE )
      respond = await editMessageRecord(chat.messages as any , Number(messageId) , content , senderId);
    else if( type === MessageType.DELETE_MESSAGE )
      return await deleteMessageRecord(chat.messages as any , Number(messageId) , senderId);
    else if( type === MessageType.REPLY_MESSAGE )
      respond = await replyMessageRecord(chat.messages as any , Number(messageId) , content , senderId);
    else if( type === MessageType.USER_TYPING )
      respond = await isTypingRecord(Boolean(isTyping));
    await sendDataToQueue( {...respond , targetId } , "broadcastData" );
    channel.ack(msg);
  }
  catch (error) 
  {
    console.error("Error processing message in chat service:", error);
    channel.nack(msg, false, false); // Discard the message on error
  }

}

