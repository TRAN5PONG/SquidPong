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











export async function processChatMessageFromRabbitMQ(msg: any)
{
    const data = JSON.parse(msg.content.toString());

    console.log("Processing message in chat service:", data);
    if (data === null) return;

    const msgType = data.type;

   console.log("Message type:", msgType);

    channel.ack(msg);
}

