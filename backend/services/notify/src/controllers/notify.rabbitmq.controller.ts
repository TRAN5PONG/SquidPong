import prisma from "../db/database";
import { channel, sendDataToQueue } from "../integration/rabbitmq.integration";


export const enum NotificationType {
  INFO = "info",
  WARNING = "warning",
  FRIEND_REQUEST = "friendRequest",
  FRIEND_REQUEST_ACCEPTED = "friendRequestAccepted",
  GAME_INVITE = "gameInvite",
  TOURNAMENT_INVITE = "tournamentInvite",
  TOURNAMENT_CANCELLED = "tournamentCancelled",
  COIN_GIFT_RECEIVED = "coinGiftReceived",
  ACHIEVEMENT_UNLOCKED = "achievementUnlocked",
  SPECTATE_INVITE = "spectateInvite",
  PREDICTION_WON = "predictionWon",
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
    const notification = await prisma.notification.create({
      data: {
        userId: data.targetId.toString(),
        type: 'FRIEND_REQUEST',
      }});
  }
  

  // const setting = await prisma.user.findUnique({
  //       where: { userId: data.targetId.toString() },
  //       select: { notificationSettings: { select: {friendRequests: true }} }
  //       });

  // if(!setting || !setting.notificationSettings) return;
  // if(!setting.notificationSettings.friendRequests) return;

  // await sendDataToQueue({
  //   targetId: data.targetId.toString(),
  //   type: data.type,
  //   timestamp: new Date().toISOString()
  // }, 'broadcastData');

}



export async function processGameNotification(data: NotificationData)
{
  const setting = await prisma.user.findUnique({
        where: { userId: data.targetId.toString() },
        select: { notificationSettings: { select: {gameInvites : true} } }
        });

  if(!setting || !setting.notificationSettings) return;
  if(!setting.notificationSettings.gameInvites) return;

  await sendDataToQueue({
    targetId: data.targetId.toString(),
    type: data.type,
    timestamp: new Date().toISOString()
  }, 'broadcastData');


}


export async function processChatNotification(data: NotificationData) 
{
  const setting = await prisma.user.findUnique({
        where: { userId: data.targetId.toString() },
        select: { notificationSettings: { select: {chatMessages : true} } }
        });
  if(!setting || !setting.notificationSettings) return;
  if(!setting.notificationSettings.chatMessages) return;
  
  await sendDataToQueue({
    targetId: data.targetId.toString(),
    type: data.type,
    timestamp: new Date().toISOString()
  }, 'broadcastData');

}

export async function processTournamentNotification(data: NotificationData) 
{
  const setting = await prisma.user.findUnique({
        where: { userId: data.targetId.toString() },
        select: { notificationSettings: { select: {tournamentUpdates : true} } }
        });
  if(!setting || !setting.notificationSettings) return;
  if(!setting.notificationSettings.tournamentUpdates) return;
  
  await sendDataToQueue({
    targetId: data.targetId.toString(),
    type: data.type,
    timestamp: new Date().toISOString()
  }, 'broadcastData');

}


  // | "info"
  // | "warning"
  // | "friendRequest"
  // | "friendRequestAccepted"
  // | "gameInvite"
  // | "tournamentInvite"
  // | "tournamentCancelled"
  // | "CoinGiftReceived" // a coin gift has been received
  // | "AchievementUnlocked" // an achievement has been unlocked
  // | "coinGiftReceived"
  // | "spectateInvite" // a friend invites you to spectate a game
  // | "predictionWon"; // a prediction you made has been won


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
        await processGameNotification(data);
        break;
        
      // Friend notifications
      case NotificationType.FRIEND_REQUEST:
      case NotificationType.FRIEND_REQUEST_ACCEPTED:
        await processFriendNotification(data);
        break;
        
      // Chat notifications
      // case NotificationType.NEW_MESSAGE:
      // case NotificationType.NEW_GROUP_MESSAGE:
      // case NotificationType.MENTION:
      //   await processChatNotification(data);
      //   break;
        
      // Tournament notifications

      case NotificationType.TOURNAMENT_INVITE:
        await processTournamentNotification(data);
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


