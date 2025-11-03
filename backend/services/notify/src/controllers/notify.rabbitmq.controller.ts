import prisma from "../db/database";
import { channel, sendDataToQueue } from "../integration/rabbitmq.integration";





export enum NotificationType {
  // Game notifications
  GAME_INVITE       = "game-invite",
  GAME_START        = "game-start",
  GAME_END          = "game-end",
  GAME_WIN          = "game-win",
  GAME_LOSE         = "game-lose",
  
  test = "friend_request",
  // Friend notifications  
  FRIEND_REQUEST    = "friend-request",
  FRIEND_ACCEPTED   = "friend-accepted",
  FRIEND_ONLINE     = "friend-online",
  FRIEND_OFFLINE    = "friend-offline",
  
  // Chat notifications
  NEW_MESSAGE       = "new-message",
  NEW_GROUP_MESSAGE = "new-group-message",
  MENTION           = "mention",
  
  // Tournament notifications
  TOURNAMENT_START  = "tournament-start",
  TOURNAMENT_END    = "tournament-end",
  TOURNAMENT_WIN    = "tournament-win",
  TOURNAMENT_INVITE = "tournament-invite",
  
  // System notifications
  SYSTEM_UPDATE     = "system-update",
  MAINTENANCE       = "maintenance",
  ACHIEVEMENT       = "achievement",
  
  // General
  INFO              = "info",
  WARNING           = "warning",
  ERROR             = "error"
}

export enum NotificationPriority {
  LOW    = "LOW",
  NORMAL = "NORMAL", 
  HIGH   = "HIGH",
  URGENT = "URGENT"
}

interface NotificationData {
  type: NotificationType;
  targetId: string;
  title?: string;
  message?: string;
  priority?: NotificationPriority;
  metadata?: any;
  sendRealTime?: boolean;
}



export async function processFriendNotification(data: NotificationData) 
{
  console.log("Processing friend notification:", data);
  if(data.type === NotificationType.FRIEND_REQUEST)
  {
    console.log("Processing FRIEND_REQUEST notification");
    const notification = await prisma.notification.create({
      data: {
        userId: data.targetId.toString(),
        type: 'FRIEND',
      }});
  }
  

  const setting = await prisma.user.findUnique({
        where: { userId: data.targetId.toString() },
        select: { notificationSettings: { select: {friendRequests: true }} }
        });

  if(setting && !setting.notificationSettings.friendRequests) return;

  await sendDataToQueue({
    targetId: data.targetId.toString(),
    type: data.type,
    timestamp: new Date().toISOString()
  }, 'broadcastData');

  console.log(`Friend notification processed for user ${data.targetId}: ${data.type}`);
}

export async function processGameNotification(data: NotificationData)
{
  console.log("Processing game notification:", data.type);
}

export async function processChatNotification(data: NotificationData) 
{
  console.log("Processing chat notification:", data.type);
}

export async function processTournamentNotification(data: NotificationData) 
{
  console.log("Processing tournament notification:", data.type);
}

export async function processSystemNotification(data: NotificationData) 
{
 console.log("Processing system notification:", data.type);
}


export async function processNotificationFromRabbitMQ(msg: any) 
{
  try 
  {
    const data = JSON.parse(msg.content.toString()) as NotificationData;
    
    if (!data || !data.type)
      throw new Error("Invalid notification data received from RabbitMQ");
    
    // Process based on notification type category
    switch (data.type) {
      // Game notifications
      case NotificationType.GAME_INVITE:
      case NotificationType.GAME_START:
      case NotificationType.GAME_END:
      case NotificationType.GAME_WIN:
      case NotificationType.GAME_LOSE:
        await processGameNotification(data);
        break;
        
      // Friend notifications
      case NotificationType.FRIEND_REQUEST:
      case NotificationType.FRIEND_ACCEPTED:
      case NotificationType.FRIEND_ONLINE:
      case NotificationType.FRIEND_OFFLINE:
        await processFriendNotification(data);
        break;
        
      // Chat notifications
      case NotificationType.NEW_MESSAGE:
      case NotificationType.NEW_GROUP_MESSAGE:
      case NotificationType.MENTION:
        await processChatNotification(data);
        break;
        
      // Tournament notifications
      case NotificationType.TOURNAMENT_START:
      case NotificationType.TOURNAMENT_END:
      case NotificationType.TOURNAMENT_WIN:
      case NotificationType.TOURNAMENT_INVITE:
        await processTournamentNotification(data);
        break;
        
      // System notifications
      case NotificationType.SYSTEM_UPDATE:
      case NotificationType.MAINTENANCE:
      case NotificationType.ACHIEVEMENT:
      case NotificationType.INFO:
      case NotificationType.WARNING:
      case NotificationType.ERROR:
        await processSystemNotification(data);
        break;
        
      default:
        throw new Error(`Unknown notification type: ${data.type}`);
    }
  } 
  catch (error) {
    console.error("Error processing notification from RabbitMQ:", error);
  }
  channel.ack(msg);
}


