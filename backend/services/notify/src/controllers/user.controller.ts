import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { UserStatus, UserCustomStatus } from '@prisma/client';

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
  const body = req.body as { status?: UserStatus; customStatus?: UserCustomStatus; username?: string; firstName?: string; lastName?: string; avatar?: string; isVerified?: boolean; notificationSettings?: { friendRequests?: boolean; chatMessages?: boolean; gameInvites?: boolean , tournamentUpdates? : boolean } };

  try 
  {
    checkSecretToken(req);
    
    const { notificationSettings, ...userFields } = body;
    
    await prisma.user.update({
      where: { userId },
      data: {
        ...userFields,
        ...(notificationSettings && { notificationSettings: { update: { ...notificationSettings } } })
      },
    });
  } 
  catch (error) {
    sendError(res, error);
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
