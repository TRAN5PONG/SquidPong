import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse } from '../utils/errorHandler';
import { createNotification , updateNotification , deleteNotification } from "../controllers/helps.controller";


export async function postSendNotificationHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: 'Notification sent successfully' };
  const body = req.body as {
    userId: number;
    title: string;
    message: string;
    type?: string;
  };

  try 
  {
    await prisma.notification.create({
      data: {
        userId: body.userId,
        title: body.title as any,
        message: body.message,
        type: body.type ? (body.type as any) : 'INFO',
      },
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

export async function updateNotificationHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'Notification updated successfully' };
  const body = req.body as  any;
  const headers = req.headers as any;

  const { notifyId } = req.params as { notifyId: string };
  const userId = Number(headers['x-user-id']);

  try 
  {
    await updateNotification({id : notifyId , userId , status : "READ"})
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) respond.message = error.message;
    return res.status(400).send(respond);
  }

  return res.send(respond);
}

export async function getNotificationHistoryHandler(req: FastifyRequest, res: FastifyReply) 
{
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  const respond: ApiResponse<any[]> = { success: true, message: 'Notifications fetched successfully' };

  try 
  {
    const notifications = await prisma.notification.findMany({
      where: { userId },
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



export async function deleteNotificationHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'Notification deleted successfully' };
  const { notifyId } = req.params as any;

  try 
  {
    await deleteNotification(Number(notifyId));
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) respond.message = error.message;
    return res.status(400).send(respond);
  }

  return res.send(respond);
}
