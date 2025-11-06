import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse } from '../utils/errorHandler';




// export interface NotificationEl {
//   id: string;
//   type: NotificationType;
//   by: User; // User who triggered the notification
//   createdAt: Date;
//   isRead: boolean;

//   payload?: {
//     info?: string;
//     warning?: string;

//     friendRequest?: {
//       id: string;
//       status: "pending" | "accepted" | "declined";
// 	  message?: string; // Optional message with the friend request
//     };

// 	gameId?: string;

//     tournamentName?: string;
//     tournamentId?: string;

// 	achievementId?: string;
// 	achievementName?: string;

//     coinAmount?: number;
//     spectateGameId?: string;

//     predictionId?: string;
// 	winningsAmount?: number; // Amount won from the prediction
//   };
// }



export async function getNotificationHistoryHandler(req: FastifyRequest, res: FastifyReply) 
{
  const headers = req.headers as any;
  const userId = String(headers['x-user-id']);
  const respond: ApiResponse<any[]> = { success: true, message: 'Notifications fetched successfully' };

  try 
  {
    const notifications = await prisma.notification.findMany({
      where: { targetId : userId },
      select: {
        id: true,
        type: true,
        isRead: true,
        createdAt: true,
        by : { select : { userId: true, username: true  , firstName : true , lastName : true , isVerified : true , avatar : true } },
        payload: { select: { friendRequest: { select: { status: true}}}}},
      orderBy: { createdAt: 'desc' },
    });
    respond.data = notifications;
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) respond.message = error.message;
    return res.status(400).send(respond);
  }

  return res.send(respond);
}




export async function markNotificationAsReadHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'Notification marked as read successfully' };
  
  const headers = req.headers as any;
  const userId = String(headers['x-user-id']);
  
  const { notifyId } = req.params as { notifyId: number };

  console.log('Marking notification as read:', notifyId, 'for user:', userId);
  try 
  {
    const notification = await prisma.notification.findUnique({
      where: { id: Number(notifyId) },
    });

    if (!notification) throw new Error('Notification not found');

    await prisma.notification.update({
      where: { id: Number(notifyId) , targetId : userId },
      data: { isRead : true }
    });
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) respond.message = error.message;
    return res.status(400).send(respond);
  }

  return res.send(respond);
}

export async function deleteNotificationHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'Notification deleted successfully' };
  const { notifyId } = req.params as { notifyId: number };
  const headers = req.headers as any;
  const userId = String(headers['x-user-id']);

  try 
  {
    const notification = await prisma.notification.findUnique({
      where: { id: Number(notifyId) , targetId : userId },
    });

    if (!notification)
      throw new Error('Notification not found');

    await prisma.notification.delete({
      where: { id: Number(notifyId) , targetId : userId },
    });
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) respond.message = error.message;
    return res.status(400).send(respond);
  }

  return res.send(respond);
}


export async function deleteAllNotificationsHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'All notifications deleted successfully' };
  const headers = req.headers as any;
  const userId = String(headers['x-user-id']);

  try 
  {
    await prisma.notification.deleteMany({ where: { targetId : userId } });
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) respond.message = error.message;
    return res.status(400).send(respond);
  }

  return res.send(respond);
}


export async function deleteAccountHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'Account deleted successfully' };
  const headers = req.headers as any;
  const userId = String(headers['x-user-id']);

  try 
  {
    // Check for secret token for inter-service communication
    const secretToken = req.headers['x-secret-token'];
    const expectedToken = process.env.SECRET_TOKEN || 'SquidPong_InterService_9f8e7d6c5b4a3928f6e5d4c3b2a19876543210abcdef';
    
    if (secretToken !== expectedToken) {
      throw new Error('Unauthorized: Invalid secret token');
    }

    // Mark user as deleted
    await prisma.user.update({
      where: { userId: userId },
      data: { isDeleted: true }
    });

    console.log(`User ${userId} marked as deleted in notify service`);
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) respond.message = error.message;
    return res.status(400).send(respond);
  }

  return res.send(respond);
}
