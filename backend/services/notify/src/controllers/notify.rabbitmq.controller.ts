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

// interface any {
//   type: NotificationType;
//   targetId: string;
//   payload?: any;
//   createdAt?: string;
// }



export async function processFriendNotification(data: any) 
{


  const setting = await prisma.user.findUnique({
        where: { userId: data.targetId.toString() },
        select: { notificationSettings: { select: {friendRequests: true }} }
        });
            
  if(!setting || !setting.notificationSettings) return;
  if(!setting.notificationSettings.friendRequests) return;
  
  
  let notification;
  if(data.type === NotificationType.FRIEND_REQUEST)
  {
    notification = await prisma.notification.create({
      data: {
        targetId: data.targetId.toString(),
        byId: data.fromId.toString(),
        type: 'FRIEND_REQUEST',
        payload: {
          create: {
            friendRequest: {
              create: {
                requestId: data.fromId.toString(),
                status: "pending",
              },
            },
          },
        },
      },
      include: { by : true , payload: { include: { friendRequest: true } }}
    });

    await sendDataToQueue({
      targetId: data.targetId.toString(),
      type: 'notification',
      message : `${notification?.by?.username} sent you a friend request.`,
    }, 'broadcastData');

  }
  else if(data.type === NotificationType.FRIEND_REQUEST_ACCEPTED)
  {
    const existNotification = await prisma.notification.findFirst({
      where: {
        targetId: data.fromId.toString(),
        type: 'FRIEND_REQUEST',
        payload: {
          friendRequest: {
            requestId: data.targetId.toString(),
            status: "pending",
          },
        },
      },
      include: { payload: { include: { friendRequest: true}}},
    });

    if (existNotification?.payload?.friendRequest) 
      {
      await prisma.friendRequest.update({
        where: { id: existNotification.payload.friendRequest.id},
        data: { status: "accepted"},
      });

    notification = await prisma.notification.create({
      data: {
        targetId: data.targetId.toString(),
        byId: data.fromId.toString(),
        type: 'FRIEND_REQUEST_ACCEPTED',
        payload: {
          create: {
            friendRequest: {
              create: {
                requestId: data.fromId.toString(),
                status: "accepted",
              },
            },
          },
          
        },
      },
      include: {by : true ,  payload: { include: { friendRequest: true } }}
    });
    
    }
    await sendDataToQueue({
      targetId: data.targetId.toString(),
      type: 'notification',
      message : `${notification?.by?.username} accepted your friend request.`,
    }, 'broadcastData');
  }


}



export async function processGameNotification(data: any)
{
  const setting = await prisma.user.findUnique({
        where: { userId: data.targetId.toString() },
        select: { notificationSettings: { select: {gameInvites : true} } }
        });

  if(!setting || !setting.notificationSettings) return;
  if(!setting.notificationSettings.gameInvites) return;

  await sendDataToQueue({
    targetId: data.targetId.toString(),
    type: 'notification',
    message : `You have a new game invite from ${data.byUsername}.`,
  }, 'broadcastData');

}


export async function processChatNotification(data: any) 
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


export async function processTournamentNotification(data: any) 
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
    const data = JSON.parse(msg.content.toString()) as any;
    
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


