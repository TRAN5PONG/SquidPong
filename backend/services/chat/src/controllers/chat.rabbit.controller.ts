import prisma from "../db/database";
import { channel } from "../integration/rabbitmqClient";
import { sendDataToQueue } from "../integration/rabbitmqClient";

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



export async function CreateMessageRecord(data: any)
{
  const { chatId, content , senderId } = data;

  const chat = await prisma.chat.findUnique({ where: { id: Number(chatId) } , include: { members: true } });
  if (!chat) throw new Error("Chat not found");

  const isMember = chat.members.some((m:any) => m.userId === senderId);
  if (!isMember) throw new Error("User is not a member of the chat");


  await prisma.message.create({
    data: {
      chatId : Number(chatId),
      content,
      senderId,
    },
  });

  const targetId = chat.members.filter((m:any) => m.userId !== senderId).map((m:any) => m.userId);
  
  console.log("Sending message to queue:", {message : content , targetId});
  await sendDataToQueue( {message : content , targetId} , "broadcastData" );

}



async function AddORUpdateReactionRecord(data: any)
{
  const { messageId, reactionType , userId } = data;

  const message = await prisma.message.findUnique({ where: { id: Number(messageId) } });
    if (!message) throw new Error("Message not found");

  const chat = await prisma.chat.findUnique({ where: { id: Number(message.chatId) } , include: { members: true } });
    if (!chat) throw new Error("Chat not found");

  const isMember = chat.members.some((m:any) => m.userId === userId);
    if (!isMember) throw new Error("User is not a member of the chat");

  await prisma.reaction.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId,
      },
    },
    update: {
      emoji: reactionType,
    },
    create: {
      messageId: Number(messageId),
      userId,
      emoji: reactionType,
    },
  });

  const targetId = chat.members.filter((m:any) => m.userId !== userId).map((m:any) => m.userId);
  
  console.log("Sending reaction to queue:", {reaction : reactionType , targetId});
  await sendDataToQueue( {reaction : reactionType , targetId} , "broadcastData" );

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




export async function processChatMessageFromRabbitMQ(msg: any)
{
  const data = JSON.parse(msg.content.toString());

  console.log("Processing message in chat service:", data);
  if (data === null) return;

  const msgType = data.type;

  if(msgType === MessageType.PRIVATE_MESSAGE)
    await CreateMessageRecord(data);
  else if( msgType === MessageType.ADD_REACTION)


  channel.ack(msg);
}

