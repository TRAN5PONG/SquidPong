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
  const { userId, username, firstName, lastName, avatar, isVerified } = req.body as {
    userId: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string;
    isVerified: boolean;
  };

  try 
  {
    checkSecretToken(req);
    const user = await prisma.user.create({
      data: {
        userId: String(userId),
        username,
        firstName,
        lastName,
        avatar,
        isVerified
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
  const { userId, username, firstName, lastName, avatar, isVerified } = req.body as {
    userId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    isVerified?: boolean;
  };

  try 
  {
    checkSecretToken(req);
    await prisma.user.update({
      where: { userId: String(userId) },
      data: {
        ...(username !== undefined && { username }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(avatar !== undefined && { avatar }),
        ...(isVerified !== undefined && { isVerified }),
      },
    });
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function deleteUser(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: 'User deleted from notify service.' };
  const { userId } = req.body as { userId: string };

  try 
  {
    checkSecretToken(req);
    await prisma.user.delete({
      where: { userId: String(userId) },
    });
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}
