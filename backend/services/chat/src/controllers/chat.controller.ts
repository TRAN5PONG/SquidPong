import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';
import { chatMessages  } from '../utils/RespondMessage';
import { findChatBetweenUsers } from '../utils/chat';
import { fetchAndEnsureUser } from '../utils/helper';



export async function createUser(req: FastifyRequest, res: FastifyReply)
{
   console.log("Creating user in chat service...");
   const respond: ApiResponse<null> = { success: true, message: 'User ensured in chat service.' };
   const {userId , username , firstName , lastName , avatar , isVerified} = req.body as { userId: string , username : string , firstName : string , lastName : string , avatar : string , isVerified : boolean };
 
   try
   {
      const user = await prisma.user.create({
         data: {
            userId : String(userId),
            username,
            firstName,
            lastName,
            avatar,
            isVerified
         },
      });
      console.log("User created in chat service:", user);
   }
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
   const {userId , username , firstName , lastName , avatar , isVerified} = req.body as { userId: string , username : string , firstName : string , lastName : string , avatar : string , isVerified : boolean };
 
   try
   {
      const user = await prisma.user.update({
         where: { userId : String(userId) },
         data: {
            ...(username !== undefined && { username }),
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(avatar !== undefined && { avatar }),
            ...(isVerified !== undefined && { isVerified }),
         },
      });
      
   }
   catch (error) 
   {
      console.log("Error updating user in chat service.");
      sendError(res ,error);
   }

   return res.send(respond);
}



export async function createChat(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<{chatId : number}> = { success: true, message: chatMessages.CREATED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const {friendId} = req.body as {friendId : string };

   try
   {
      if (userId === friendId)
         throw new Error(chatMessages.CANNOT_CHAT_SELF);
      

      // Check if a chat already exists between the two users
      const existingChatId = await findChatBetweenUsers(Number(userId), Number(friendId));
      
      if(existingChatId)
      {
         respond.data = { chatId: existingChatId };
         return res.send(respond);
      }

      await verifyFriendship(userId, friendId);

      const user = await fetchAndEnsureUser(userId);
      const newChat = await prisma.chat.create({
         data: {
            members: {
               create: [
                  { userId },
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

// export async function getLastActiveUsers(req: FastifyRequest, res: FastifyReply)
// {
//    const respond: ApiResponse<any> = { success: true, message: chatMessages.FETCH_SUCCESS };
//    const headers = req.headers as { 'x-user-id': string };
//    const userId = headers['x-user-id'];

//    try 
//    {
//       const users = await prisma.user.findMany({
//          where: {
//             lastActive: {
//                not: null,
//             },
//             userId: {
//                not: userId,
//             },
//          },
//          orderBy: {
//             lastActive: 'desc',
//          },
//          take: 10, // Limit to 10 users
//       });

//       respond.data = users;
//    } 
//    catch (error) 
//    {
//       sendError(res ,error);
//    }

//    return res.send(respond);
// }



async function getConversation(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<any> = { success: true, message: chatMessages.FETCH_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   try 
   {
      const chats = await prisma.chat.findMany({
         where: {
            members: {
               some: { userId }
            }
         },
         include: {
            members: true,
            messages: {
               orderBy: { createdAt: 'desc' },
               take: 1, // Get only the latest message
            },
         },
         orderBy: {
            updatedAt: 'desc', // Order chats by their last update time
         },
      });

      // Format the response to include only necessary details
      const formattedChats = chats.map(chat => ({
         chatId: chat.id,
         members: chat.members,
         latestMessage: chat.messages[0] || null, // Latest message
      }));

      respond.data = formattedChats;
   } 
   catch (error) 
   {
      sendError(res ,error);
   }

   return res.send(respond);
}