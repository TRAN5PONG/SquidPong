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

   const {friendId} = req.body as {friendId : string };

   try
   {
      if (userId === friendId) throw new Error(chatMessages.CANNOT_CHAT_SELF);
      await fetchAndEnsureUser(friendId);

      const existingChatId = await findChatBetweenUsers(Number(userId), Number(friendId));
      if(existingChatId)
      {
         respond.data = { chatId: existingChatId };
         return res.send(respond);
      }

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
         include: 
         { members: {include : {user : true}} , 
         messages: {include : {reactions : true , sender:true}} },

      });
      if (!chat)  throw new Error(chatMessages.FETCH_NOT_FOUND);
   
      const isMember = chat.members.some((m:any) => m.userId === userId);
      if (!isMember)  throw new Error(chatMessages.FETCH_NOT_FOUND);

      console.log("Chat messages:", chat.messages);
      const newData = chat.messages.map((msg:any) => ({
         from : msg.sender,
         date : msg.timestamp,
         message : msg.content,
         status : msg.status,
         reactions : msg.reactions,
         type : msg.type,
         replyTo : msg.replyToId ?  prisma.message.findUnique({ where: { id: Number(msg.replyToId) } }) : null,
      }));
      respond.data = newData;

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

   let dataRespond : any = [];
   try 
   {
      const recentChats = await prisma.chat.findMany({
        where: { 
          members: { some: { userId } },
        },
        include: {
          members: { include: {user: true },},
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            include: {
              sender: true,
              reactions: { include: { user: true } },
              replyTo: { include: { sender: true } },
            },
          },
        },
      });

      for(const chat of recentChats)
      {
         const unreadCount = 0;
         dataRespond.push({
            id: chat.id,
            participants: chat.members.map((m:any) => m.user),
            lastMessage : chat.messages[0] || null,
            unreadCount : unreadCount,
         });
      }

      respond.data = dataRespond
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


// ------------------- Message Endpoints -------------------

export async function sendMessageHandler(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<{ content: string }> = { success: true, message: 'Message sent successfully' };
   const headers = req.headers as { 'x-user-id': string };
   const senderId = headers['x-user-id'];
   
   const { chatId, content } = req.body as { chatId: number; content: string };


   try 
   {
      const chat = await prisma.chat.findFirst({
         where: {
            id: Number(chatId),
            members: { some: { userId: senderId } }
         }
      });

      if (!chat) throw new Error('Chat not found or user is not a member');

      await prisma.message.create({
         data: {
            chatId: Number(chatId),
            content,
            senderId

         },
      });

      respond.data = { content };
   }
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}


export async function editMessageHandler(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<{ messageId: number; content: string }> = { success: true, message: 'Message edited successfully' };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];
   
   const { messageId } = req.params as { messageId: string };
   const { content } = req.body as { content: string };

   try 
   {
      const message = await prisma.message.findUnique({
         where: { id: Number(messageId) }
      });

      if (!message) throw new Error('Message not found');
      if (message.senderId !== userId) throw new Error('Only the sender can edit the message');

      await prisma.message.update({
         where: { id: Number(messageId) },
         data: { content, isEdited: true },
      });

      respond.data = { messageId: Number(messageId), content };
   }
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}


export async function deleteMessageHandler(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<{ messageId: number }> = { success: true, message: 'Message deleted successfully' };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];
   
   const { messageId } = req.params as { messageId: string };

   try 
   {
      const message = await prisma.message.findUnique({
         where: { id: Number(messageId) }
      });

      if (!message) throw new Error('Message not found');
      if (message.senderId !== userId) throw new Error('Only the sender can delete the message');

      await prisma.message.delete({ where: { id: Number(messageId) } });

      respond.data = { messageId: Number(messageId) };
   }
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}


export async function replyToMessageHandler(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<any> = { success: true, message: 'Reply sent successfully' };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];
   
   const { messageId } = req.params as { messageId: string };
   const { content } = req.body as { content: string };

   try 
   {
      const originalMessage = await prisma.message.findUnique({
         where: { id: Number(messageId) }
      });

      if (!originalMessage) throw new Error('Original message not found');

      const replyMessage = await prisma.message.create({
         data: {
            chatId: originalMessage.chatId,
            content,
            senderId: userId,
            replyToId: Number(messageId),
         },
      });

      respond.data = { replyMessage };
   }
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}


export async function addReactionHandler(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<{ emoji: string }> = { success: true, message: 'Reaction added successfully' };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];
   
   const { messageId } = req.params as { messageId: string };
   const { emoji } = req.body as { emoji: string };

   try 
   {
      const message = await prisma.message.findUnique({
         where: { id: Number(messageId) }
      });

      if (!message) throw new Error('Message not found');

      await prisma.reaction.upsert({
         where: {
            messageId_userId: {
               messageId: Number(messageId),
               userId
            },
         },
         update: { emoji: emoji as any },
         create: { messageId: Number(messageId), userId, emoji: emoji as any },
      });

      respond.data = { emoji };
   }
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}


export async function removeReactionHandler(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<{ messageId: number }> = { success: true, message: 'Reaction removed successfully' };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];
   
   const { messageId } = req.params as { messageId: string };

   try 
   {
      const message = await prisma.message.findUnique({
         where: { id: Number(messageId) }
      });

      if (!message) throw new Error('Message not found');

      await prisma.reaction.delete({
         where: {
            messageId_userId: {
               messageId: Number(messageId),
               userId: userId,
            },
         },
      });

      respond.data = { messageId: Number(messageId) };
   }
   catch (error) 
   {
      sendError(res, error);
   }

   return res.send(respond);
}
