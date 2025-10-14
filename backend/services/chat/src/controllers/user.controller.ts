import { FastifyRequest, FastifyReply } from 'fastify';
import { sendError } from '../utils/errorHandler';
import { ApiResponse } from '../utils/errorHandler';
import prisma from '../db/database';


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
      console.log("Creating user in chat service with body:", body);
      await prisma.user.create({ data: {...body }})}
   catch (error) 
   {
      console.log("User already exists in chat service.");
      sendError(res ,error);
   }

   return res.send(respond);
}



export async function updateUser(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<null> = { success: true, message: 'User updated in chat service.' };
   const userId = String((req.headers as any)['x-user-id']);

   const body = req.body as { username?: string; firstName?: string; lastName?: string; avatar?: string; isVerified?: boolean , preferences? : { notificationSettings? : { emailNotifications?: boolean; pushNotifications?: boolean; smsNotifications?: boolean; } } };
 
   try
   {
      checkSecretToken(req);
      await prisma.user.update({
         where: { userId },
         data: {...body}});
   }
   catch (error) 
   {
      console.log("Error updating user in chat service.");
      sendError(res ,error);
   }

   return res.send(respond);
}

