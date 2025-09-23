import prisma from "../db/database";
import { channel } from "../integration/rabbitmqClient";
import { sendDataToQueue } from "../integration/rabbitmqClient";
import { checkChatMembershipAndGetOthers } from "../utils/chat";
import redis from "../integration/redisClient";

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
  FORWARD_MESSAGE   = "forward-message",
  REPLY_MESSAGE     = "reply-message",
  EDIT_MESSAGE      = "edit-message",
  DELETE_MESSAGE    = "delete-message",

  ADD_REACTION      = "add-reaction",
  REMOVE_REACTION   = "remove-reaction",

  SEND_IMAGE        = "send-image",
  SEND_VIDEO        = "send-video",
  SEND_AUDIO        = "send-audio",
  SEND_FILE         = "send-file",
  SEND_VOICE_NOTE   = "send-voice-note",
  SEND_STICKER      = "send-sticker",


  
  CREATE_GROUP      = "create-group",
  UPDATE_GROUP      = "update-group",
  DELETE_GROUP      = "delete-group",
  ADD_MEMBER        = "add-member",
  REMOVE_MEMBER     = "remove-member",
  LEAVE_GROUP       = "leave-group",
  PROMOTE_ADMIN     = "promote-admin",
  DEMOTE_ADMIN      = "demote-admin",

  CREATE_POLL       = "create-poll",
  VOTE_POLL         = "vote-poll",
  CLOSE_POLL        = "close-poll",

  // --- Ephemeral ---
  USER_TYPING       = "user-typing",
  USER_ONLINE       = "user-online",
  USER_OFFLINE      = "user-offline",
  MESSAGE_DELIVERED = "message-delivered",
  MESSAGE_SEEN      = "message-seen",
  GAME_MESSAGE      = "game-message",
  MATCH_EVENT       = "match-event",

  
  // --- Semi-ephemeral ---
  VOICE_CALL_START  = "voice-call-start",
  VOICE_CALL_END    = "voice-call-end",
  VIDEO_CALL_START  = "video-call-start",
  VIDEO_CALL_END    = "video-call-end",
}



export async function CreateMessageRecord(chatId : number , senderId : string  ,  content  : string )
{

  await prisma.message.create({ data: {chatId , content, senderId} });

  return {content};
}



async function AddORUpdateReactionRecord(messages : [] ,  messageId: number , reaction : string)
{

  console.log(messages)
  const message:any = messages.find((m:any) => m.id === messageId);
  if (!message) throw new Error("Message not found");

  await prisma.reaction.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId : message.senderId,
      },
    },
    update: {
      emoji: reaction,
    },
    create: {
      messageId: Number(messageId),
      userId : message.senderId,
      emoji: reaction,
    },
  });

  return {reaction};
}


async function RemoveReactionRecord(data: any)
{
  const { messageId, reactionType , userId } = data;

  const message = await prisma.message.findUnique({ where: { id: Number(messageId) } });
    if (!message) throw new Error("Message not found");

  const chat = await prisma.chat.findUnique({ where: { id: Number(message.chatId) } , include: { members: true } });
    if (!chat) throw new Error("Chat not found");

  const isMember = chat.members.some((m:any) => m.userId === userId);
    if (!isMember) throw new Error("User is not a member of the chat");

  await prisma.reaction.deleteMany({
    where: {
      messageId : Number(messageId),
      userId,
      emoji: reactionType,
    },
  });

  const targetId = chat.members.filter((m:any) => m.userId !== userId).map((m:any) => m.userId);
  
  console.log("Sending reaction removal to queue:", {reaction : reactionType , targetId});
  await sendDataToQueue( {reaction : reactionType , targetId} , "broadcastData" );

}    


export async function editMessageRecord(data: any)
{
  const { messageId, newContent , editorId } = data;

  const message = await prisma.message.findUnique({ where: { id: Number(messageId) } });
    if (!message) throw new Error("Message not found");

  if(message.senderId !== editorId) throw new Error("Only the sender can edit the message");

  await prisma.message.update({
    where: { id: Number(messageId) },
    data: { content: newContent },
  });

  const chat = await prisma.chat.findUnique({ where: { id: Number(message.chatId) } , include: { members: true } });
    if (!chat) throw new Error("Chat not found");

  const targetId = chat.members.filter((m:any) => m.userId !== editorId).map((m:any) => m.userId);
  
  console.log("Sending edited message to queue:", {editedMessage : newContent , targetId});
  await sendDataToQueue( {editedMessage : newContent , targetId} , "broadcastData" );
  
}


export async function deleteMessageRecord(data: any)
{
  const { messageId, deleterId } = data;

  const message = await prisma.message.findUnique({ where: { id: Number(messageId) } });
    if (!message) throw new Error("Message not found");

  if(message.senderId !== deleterId) throw new Error("Only the sender can delete the message");

  await prisma.message.delete({
    where: { id: Number(messageId) },
  });

  const chat = await prisma.chat.findUnique({ where: { id: Number(message.chatId) } , include: { members: true } });
    if (!chat) throw new Error("Chat not found");

  const targetId = chat.members.filter((m:any) => m.userId !== deleterId).map((m:any) => m.userId);
  
  console.log("Sending deleted message info to queue:", {deletedMessageId : messageId , targetId});
  await sendDataToQueue( {deletedMessageId : messageId , targetId} , "broadcastData" );
  
}


export async function replyMessageRecord(data: any)
{
  const { chatId, content , senderId , replyToId } = data;

  const chat = await prisma.chat.findUnique({ where: { id: Number(chatId) } , include: { members: true } });
  if (!chat) throw new Error("Chat not found");
  
  const isMember = chat.members.some((m:any) => m.userId === senderId);
  if (!isMember) throw new Error("User is not a member of the chat");
  const repliedMessage = await prisma.message.findUnique({ where: { id: Number(replyToId) } });
  if (!repliedMessage) throw new Error("Replied message not found");

  const newMessage = await prisma.message.create({
    data: {
      chatId : Number(chatId),
      content,
      senderId,
      replyToId: Number(replyToId),
    },
  });
  
  const targetId = chat.members.filter((m:any) => m.userId !== senderId).map((m:any) => m.userId);
  console.log("Sending replied message to queue:", {message : content , replyToId, targetId});
  await sendDataToQueue( {message : content , replyToId, targetId} , "broadcastData" );

  return newMessage;  

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




export async function processChatMessageFromRabbitMQ(msg: any)
{
  let respond;

  try 
  {
    const data = JSON.parse(msg.content.toString());
    if (data === null) throw new Error("Received null data from RabbitMQ");
    
    const { type , chatId , senderId , content , reaction , messageId } = data;
    const {targetId , chat} = await checkChatMembershipAndGetOthers(Number(chatId), Number(senderId));

    
    if( type === MessageType.PRIVATE_MESSAGE || type === MessageType.GROUP_MESSAGE )
      respond = await CreateMessageRecord(Number(chatId), String(senderId), String(content) );
    else if( type === MessageType.ADD_REACTION )
      respond = await AddORUpdateReactionRecord(chat.messages , Number(messageId), reaction );


    await sendDataToQueue( {...respond , targetId } , "broadcastData" );
    channel.ack(msg);
  }
  catch (error) 
  {
    console.error("Error processing message in chat service:", error);
    channel.nack(msg, false, false); // Discard the message on error
  }

}

