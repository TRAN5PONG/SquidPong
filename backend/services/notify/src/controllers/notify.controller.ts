import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse } from '../utils/errorHandler';




export async function createNotificationHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: 'Notification created successfully' };

  try 
  {
    // Check for secret token for inter-service communication
    const secretToken = req.headers['x-secret-token'];
    const expectedToken = process.env.SECRET_TOKEN || 'SquidPong_InterService_9f8e7d6c5b4a3928f6e5d4c3b2a19876543210abcdef';
    
    if (secretToken !== expectedToken) {
      throw new Error('Unauthorized: Invalid secret token');
    }

    const body = req.body as any;
    const { userId, message, type } = body;

    if (!userId || !message) {
      throw new Error('userId and message are required');
    }

    const notification = await prisma.notification.create({
      data: {
        userId: String(userId),
        type: type || 'INFO',
        isRead: false
      }
    });

    respond.data = notification;
    console.log(`Notification created for user ${userId}: ${message}`);
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) respond.message = error.message;
    return res.status(400).send(respond);
  }

  return res.send(respond);
}


export async function updateNotificationHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'Notification updated successfully' };
  
  const headers = req.headers as any;
  const userId = String(headers['x-user-id']);
  const { notifyId } = req.params as { notifyId: string };

  try 
  {
    const body = req.body as any;
    const { message, type, isRead } = body;

    const updateData: any = {};
    if (message !== undefined) updateData.message = message;
    if (type !== undefined) updateData.type = type;
    if (isRead !== undefined) updateData.isRead = isRead;

    await prisma.notification.update({
      where: { 
        id: Number(notifyId),
        userId: userId 
      },
      data: updateData
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
      where: { userId },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true
          }
        }
      },
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
  
  const { notifyId } = req.params as { notifyId: string };

  try 
  {
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
  const { notifyId } = req.params as { notifyId: string };
  const headers = req.headers as any;
  const userId = String(headers['x-user-id']);

  try 
  {
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
    await prisma.notification.deleteMany({ where: { userId } });
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
