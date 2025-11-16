import { FastifyRequest, FastifyReply } from 'fastify';
import { sendError } from '../utils/errorHandler';
import { ApiResponse } from '../utils/errorHandler';
import prisma from '../db/database';
import { UserStatus, UserStatusCustom } from '@prisma/client';


function checkSecretToken(req: FastifyRequest) 
{
  const token = req.headers['x-secret-token'];
  if (token !== process.env.SECRET_TOKEN)
    throw new Error('Unauthorized: Invalid secret token');
}


export async function createUser(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<null> = { success: true, message: 'User ensured in chat service.' };
   const body = req.body as {userId : string  ,username : string , firstName : string , lastName : string , avatar : string , isVerified : boolean };
 
   try
   {
      checkSecretToken(req);
      await prisma.user.create({ data: {...body }})
   }
   catch (error) 
   {
      sendError(res ,error);
   }

   return res.send(respond);
}



export async function updateUser(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'User updated in chat service.' };
  const userId = String((req.headers as any)['x-user-id']);
  
  const body = req.body as {status?: UserStatus , customStatus? : UserStatusCustom , username?: string , firstName?: string , lastName?: string , avatar?: string , isVerified?: boolean   };
  
  try
  {
   checkSecretToken(req);
   await prisma.user.update({
      where: { userId },
      data: {...body}});
  }
  catch (error) 
  { sendError(res ,error)}
   
  return res.send(respond);
}


export async function deleteAccountHandler(req: FastifyRequest,res: FastifyReply) 
{
  const respond: ApiResponse<null> = {
    success: true,
    message: "Account deleted successfully",
  };
  const headers = req.headers as { "x-user-id": string };
  const userId = headers["x-user-id"];

  try {
    checkSecretToken(req);

    await prisma.user.update({
      where: { userId },
      data: { isDeleted: true },
    });

    console.log(`User ${userId} marked as deleted in chat service`);
  } catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

