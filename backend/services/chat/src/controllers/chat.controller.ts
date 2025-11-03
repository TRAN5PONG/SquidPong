import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';
import { chatMessages  } from '../utils/RespondMessage';
import { findChatBetweenUsers } from '../utils/chat';
import { fetchAndEnsureUser } from '../utils/helper';
import { checkSecretToken } from '../utils/helper';
import app from '../app';



export async function createChat(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<{chatId : number}> = { success: true, message: chatMessages.CREATED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   console.log(`Creating chat for userId: ${userId}`);
   console.log(`Request body: ${JSON.stringify(req.body)}`);
   const {friendId} = req.body as {friendId : string };

   try
   {
      if (userId === friendId)
         throw new Error(chatMessages.CANNOT_CHAT_SELF);
      
      const existingChatId = await findChatBetweenUsers(Number(userId), Number(friendId));
      if(existingChatId)
      {
         respond.data = { chatId: existingChatId };
         return res.send(respond);
      }

      await verifyFriendship(userId, friendId);

         // Fetch both users by userId field
      
         const newChat = await prisma.chat.create({
            data: {
               members: {
                  create: [
                     { user: { connect: { userId } } },
                     { user: { connect: { userId : friendId } } }
                  ]
               }
            }
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
   
   console.log("Request to delete chat received");
   console.log(app.swagger());
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


export async function getRecentChats(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<any> = { success: true, message: 'Recent chats fetched successfully.' };
   
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];
   
   const { limit = '10' } = req.query as { limit?: string };

   try 
   {

      const recentChats = await prisma.chat.findMany({
         where: {
            members: { some: { userId } },
            messages: { some: {} }
         },
         include: {
            members: {
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
               }
            },
            group: {
               select: {
                  id: true,
                  name: true,
                  desc: true,
                  imageUrl: true,
                  type: true
               }
            },
            messages: {
               orderBy: {
                  timestamp: 'desc'
               },
               take: 1,
               include: {
                  sender: {
                     select: {
                        userId: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                     }
                  }
               }
            }
         }
      });


      const formattedChats = recentChats
         .filter((chat: any) => chat.messages.length > 0)
         .map((chat: any) => {
            const lastMessage = chat.messages[0];
            
            if (chat.type === 'PRIVATE') 
               {
               const otherUser = chat.members.find((member: any) => member.userId !== userId)?.user;
               
               return {
                  chatId: chat.id,
                  type: 'PRIVATE',
                  user: otherUser,
                  lastMessage: {
                     id: lastMessage.id,
                     content: lastMessage.content,
                     type: lastMessage.type,
                     sender: lastMessage.sender,
                     timestamp: lastMessage.timestamp,
                     isEdited: lastMessage.isEdited
                  },
                  createdAt: chat.createdAt
               };
            } 
            else {
               return {
                  chatId: chat.id,
                  type: 'GROUP',
                  group: chat.group,
                  lastMessage: {
                     id: lastMessage.id,
                     content: lastMessage.content,
                     type: lastMessage.type,
                     sender: lastMessage.sender,
                     timestamp: lastMessage.timestamp,
                     isEdited: lastMessage.isEdited
                  },
                  createdAt: chat.createdAt
               };
            }
         })
         .sort((a: any, b: any) => {
            const aTime = new Date(a.lastMessage.timestamp).getTime();
            const bTime = new Date(b.lastMessage.timestamp).getTime();
            return bTime - aTime; // Sort by most recent first
         })
         .slice(0, Number(limit));

      respond.data = { recentChats: formattedChats, total: formattedChats.length};

   } 
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}


export async function blockUserHandler(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<null> = { success: true, message: 'User blocked successfully' };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { friendId } = req.params as { friendId: string };

   try 
   {
      checkSecretToken(req);
      const chatId = await findChatBetweenUsers(Number(userId), Number(friendId));
      if (!chatId) throw new Error('Chat not found between users');

      await prisma.chat.update({
         where: { id: Number(chatId) },
         data: {
            members: {
               updateMany: {
                  where: { userId: friendId },
                  data: { isBlocked: true }
               }
            }
         }
      });
   }
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}


export async function removeUserHandler(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<null> = { success: true, message: chatMessages.DELETE_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { friendId } = req.params as { friendId: string };

   try 
   {
      checkSecretToken(req);
      const chatId = await findChatBetweenUsers(Number(userId), Number(friendId));
      if (!chatId) throw new Error('Chat not found between users');

      await prisma.chat.delete({ where: { id: Number(chatId) }});
   }
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}


export async function unblockUserHandler(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<null> = { success: true, message: 'User unblocked successfully' };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { friendId } = req.params as { friendId: string };

   try 
   {
      checkSecretToken(req);
      const chatId = await findChatBetweenUsers(Number(userId), Number(friendId));
      if (!chatId) throw new Error('Chat not found between users');

      await prisma.chat.update({
         where: { id: Number(chatId) },
         data: {
            members: {
               updateMany: {
                  where: { userId: friendId },
                  data: { isBlocked: false }
               }
            }
         }
      });
   }
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}



export async function deleteAccountHandler(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<null> = { success: true, message: 'Account deleted successfully' };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   try 
   {
      checkSecretToken(req);
      
      await prisma.user.update({
         where: { userId },
         data: { isDeleted: true }
      });

      console.log(`User ${userId} marked as deleted in chat service`);
   }
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}
