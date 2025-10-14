import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse, sendError } from '../utils/errorHandler';

function checkSecretToken(req: FastifyRequest) {
  const token = req.headers['x-secret-token'];
  if (token !== process.env.SECRET_TOKEN) {
    throw new Error('Unauthorized: Invalid secret token');
  }
}

export async function createUser(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: 'User ensured in notify service.' };
  const body = req.body as { userId: string; username: string; firstName: string; lastName: string; avatar : string; isVerified : boolean };

  try 
  {
    checkSecretToken(req);
    await prisma.user.create({
      data: {
        ...body,
        notificationSettings: { create: {} }
      },
    });
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function updateUser(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: 'User updated in notify service.' };
  const userId = String((req.headers as any)['x-user-id']);

  const body = req.body as any;

  console.log('notify services   Update request body:', body);
  try 
  {
    checkSecretToken(req);
    await prisma.user.update({
      where: { userId },
      data: {
        ...body,
        ...(body.notificationSettings &&  {notificationSettings: { update: {...body.notificationSettings} }})
      },
    });
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}
