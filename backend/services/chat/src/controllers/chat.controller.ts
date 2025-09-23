import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';
import { chatMessages  } from '../utils/RespondMessage';
import { verifyUserId } from '../utils/helper';
import { findChatBetweenUsers } from '../utils/chat';



export async function createChat(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<{chatId : number}> = { success: true, message: chatMessages.CREATED_SUCCESS };
   const {userId , friendId} = req.query as { userId: string , friendId : string };


   try
   {
      const newChat = await prisma.chat.create({
         data: {
            members: {
               create: [
                  { userId: userId },
                  { userId: friendId },
               ],
              },
          },
      });

      console.log(newChat);
      respond.data = { chatId: newChat.id };

   }
   catch (error) 
   {
      sendError(res ,error);
   }

   return res.send(respond);
}




export async function removeChat(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<null> = { success: true, message: chatMessages.DELETE_SUCCESS };
   const {userId , friendId} = req.query as { userId: string , friendId : string };

    try 
    {
      const chatId = await findChatBetweenUsers(Number(userId), Number(friendId));
      await prisma.chat.delete({ where: { id: Number(chatId) }});
    } 
    catch (error) 
    {
      sendError(res ,error);
    }

    return res.send(respond);

}


export async function getChatById(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<any> = { success: true, message: chatMessages.FETCH_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { chatId } = req.params as { chatId: string };

   try 
   {
      const chat = await prisma.chat.findUnique({
         where: { id: Number(chatId) },
         include: { members: true , messages: true },

      });
      if (!chat) 
         throw new Error(chatMessages.FETCH_NOT_FOUND);
   
      const isMember = chat.members.some((m:any) => m.userId === userId);
      if (!isMember) 
         throw new Error(chatMessages.FETCH_NOT_FOUND);

      respond.data = chat;
      } 
      catch (error){
         sendError(res ,error);
      }

      return res.send(respond);

}

