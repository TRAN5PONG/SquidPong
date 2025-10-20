import prisma from "../db/database";
import { sendDataToQueue } from "../integration/rabbitmqClient";


export enum NotificationType {
  // Game notifications
  GAME_INVITE       = "game-invite",
  GAME_START        = "game-start",
  GAME_END          = "game-end",
  GAME_WIN          = "game-win",
  GAME_LOSE         = "game-lose",
  
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
  userId: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  metadata?: any;
  sendRealTime?: boolean;
}


export async function createNotificationRecord(data: NotificationData) 
{
  const { userId, message, type } = data;
  
  const notification = await prisma.notification.create({
    data: {
      userId,
      message,
      type: type as any,
      isRead: false,
      createdAt: new Date()
    }
  });

  return notification;
}

export async function sendRealtimeNotification(data: NotificationData) 
{
  const { userId, message, type, priority = NotificationPriority.NORMAL } = data;

    await sendDataToQueue({
      userId,
      message,
      type,
      timestamp: new Date().toISOString()
    }, 'broadcastData');
    
    console.log(`Real-time notification sent to user ${userId}: ${type}`);

}

export async function processGameNotification(data: NotificationData) 
{
  // Create notification record
  const notification = await createNotificationRecord(data);
  
  // Send real-time notification if enabled
  if (data.sendRealTime !== false) {
    await sendRealtimeNotification(data);
  }
  
  return notification;
}

export async function processFriendNotification(data: NotificationData) {
  // Create notification record
  const notification = await createNotificationRecord(data);
  
  // Send real-time notification for friend events
  if (data.sendRealTime !== false) {
    await sendRealtimeNotification(data);
  }
  
  return notification;
}

export async function processChatNotification(data: NotificationData) {
  // For chat notifications, we might want to check user's notification preferences
  // or if they have the chat open (could be implemented later)
  
  const notification = await createNotificationRecord(data);
  
  if (data.sendRealTime !== false) {
    await sendRealtimeNotification(data);
  }
  
  return notification;
}

export async function processTournamentNotification(data: NotificationData) {
  const notification = await createNotificationRecord(data);
  
  // Tournament notifications are usually important
  if (data.sendRealTime !== false) {
    await sendRealtimeNotification(data);
  }
  
  return notification;
}

export async function processSystemNotification(data: NotificationData) {
  const notification = await createNotificationRecord(data);
  
  // System notifications with urgent priority should always be sent real-time
  if (data.priority === NotificationPriority.URGENT || data.sendRealTime !== false) {
    await sendRealtimeNotification(data);
  }
  
  return notification;
}

export async function processNotificationFromRabbitMQ(msg: any) 
{
  try 
  {
    const data = JSON.parse(msg.content.toString()) as NotificationData;
    
    if (!data || !data.type || !data.userId) {
      throw new Error("Invalid notification data received from RabbitMQ");
    }
    
    let result;
    
    // Process based on notification type category
    switch (data.type) {
      // Game notifications
      case NotificationType.GAME_INVITE:
      case NotificationType.GAME_START:
      case NotificationType.GAME_END:
      case NotificationType.GAME_WIN:
      case NotificationType.GAME_LOSE:
        result = await processGameNotification(data);
        break;
        
      // Friend notifications
      case NotificationType.FRIEND_REQUEST:
      case NotificationType.FRIEND_ACCEPTED:
      case NotificationType.FRIEND_ONLINE:
      case NotificationType.FRIEND_OFFLINE:
        result = await processFriendNotification(data);
        break;
        
      // Chat notifications
      case NotificationType.NEW_MESSAGE:
      case NotificationType.NEW_GROUP_MESSAGE:
      case NotificationType.MENTION:
        result = await processChatNotification(data);
        break;
        
      // Tournament notifications
      case NotificationType.TOURNAMENT_START:
      case NotificationType.TOURNAMENT_END:
      case NotificationType.TOURNAMENT_WIN:
      case NotificationType.TOURNAMENT_INVITE:
        result = await processTournamentNotification(data);
        break;
        
      // System notifications
      case NotificationType.SYSTEM_UPDATE:
      case NotificationType.MAINTENANCE:
      case NotificationType.ACHIEVEMENT:
      case NotificationType.INFO:
      case NotificationType.WARNING:
      case NotificationType.ERROR:
        result = await processSystemNotification(data);
        break;
        
      default:
        throw new Error(`Unknown notification type: ${data.type}`);
    }
    
    console.log(`Processed notification: ${data.type} for user ${data.userId}`);
    
    return result;
    
  } catch (error) {
    console.error("Error processing notification from RabbitMQ:", error);
    throw error;
  }
}

// Helper function to send notification via RabbitMQ
export async function sendNotificationToQueue(data: NotificationData) {
  try {
    await sendDataToQueue(data, "notify");
    console.log(`Notification queued: ${data.type} for user ${data.userId}`);
  } catch (error) {
    console.error("Error sending notification to queue:", error);
    throw error;
  }
}

