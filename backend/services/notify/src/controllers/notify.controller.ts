import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse } from '../utils/errorHandler';
import { updateNotification , deleteNotification } from "../utils/helps";



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
    await updateNotification({ id: notifyId, userId, status: "READ" });
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
    await deleteNotification({id : Number(notifyId) , userId});
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
