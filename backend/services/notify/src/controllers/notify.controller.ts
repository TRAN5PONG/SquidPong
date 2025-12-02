import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse } from '../utils/errorHandler';
import { getVisibleStatus } from '../utils/statusHelper';



export async function getNotificationHistoryHandler(
  req: FastifyRequest,
  res: FastifyReply
) {
  const headers = req.headers as any;
  const userId = String(headers["x-user-id"]);

  const respond: ApiResponse<any[]> = {
    success: true,
    message: "Notifications fetched successfully",
  };

  try {
    const notifications = await prisma.notification.findMany({
      where: { targetId: userId },
      include: {
        by: true,              // include full user
        payload: {
          include: {
            friendRequest: true,   // include nested FK relation
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    respond.data = notifications;
  } catch (error) {
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


export async function markNotificationAsReadAllHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'All notifications marked as read successfully' };
  const headers = req.headers as any;
  const userId = String(headers['x-user-id']);

  try 
  {
    await prisma.notification.updateMany({
      where: { targetId : userId , isRead : false },
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

