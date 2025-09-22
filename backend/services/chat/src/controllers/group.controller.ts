import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';
import { verifyUserId } from '../utils/helper';
import { GroupMessages } from '../utils/RespondMessage';
import { checkUserAndFetchGroup } from '../utils/group.check';


enum GroupRole {
   ADMIN = 'ADMIN',
   MEMBER = 'MEMBER',
   OWNER = 'OWNER',
}

const { ADMIN , MEMBER , OWNER } = GroupRole ;


enum typeofChat {
   PRIVATE = 'PRIVATE',
   GROUP = 'GROUP',
}

const { PRIVATE , GROUP } = typeofChat ;




export async function  createGroup(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<any> = { success: true, message: GroupMessages.CREATED_SUCCESS };

   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { name  , desc  } = req.body as { name: string; desc: string };

   try
   {
      const newGroup = await prisma.group.create({
      data: {
       name,
       desc,
       members: {
         create: [
           {
             userId,
             role: OWNER,
           },
         ],
       },
       chat: {
         create: {
           type: "GROUP",
           members: {
             create: [
               {
                 userId,
               },
             ],
           },
         },
       },
      },
      include: {
        chat: true,
      },
      });

      if (!newGroup)
        throw new Error(GroupMessages.CREATED_FAILED);
   respond.data = newGroup;
   
   }
   catch (error) {
      sendError(res ,error);
   }
      
   return res.send(respond);
}



export async function  removeGroup(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<null> = { success: true, message: GroupMessages.DELETED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId));

      const member = group.members.find((m:any) => m.userId === userId);
      if (!member || member.role !== OWNER)
         throw new Error(GroupMessages.DELETED_FAILED); 

      await prisma.chat.delete({ where: { id: group.chatId } });

   } 
   catch (error) 
   {
      sendError(res ,error);
   }

   return res.send(respond);
}



export async function  getGroupById(req: FastifyRequest, res: FastifyReply) 
{

   const respond: ApiResponse<{ id: string; name: string; desc: string; members: number }> = { success: true, message: GroupMessages.FETCH_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId));
      
      const isMember = group.members.some((m:any) => m.userId === userId);
      if (!isMember)
         throw new Error(GroupMessages.FETCH_NOT_FOUND);

      respond.data = { id: String(group.id), name: group.name, desc: group.desc ?? '', members: group.members.length };

   } 
   catch (error) 
   {
      sendError(res ,error);
   }

   return res.send(respond);
}





export async function  addGroupMember(req: FastifyRequest, res: FastifyReply) 
{

   const respond: ApiResponse<null> = { success: true, message: GroupMessages.MEMBER_ADDED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: number };
   const { newMemberId  } = req.body as { newMemberId: number  };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(userId), Number(newMemberId), Number(groupId) , true);

      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role === MEMBER) 
         throw new Error(GroupMessages.NOT_HAVE_PERMISSION); 
      
      const alreadyMember = group.members.some((m:any) => m.userId === String(newMemberId));
      console.log("Is already member:", alreadyMember);
      if (alreadyMember)
         throw new Error(GroupMessages.MEMBER_ALREADY_EXISTS); 
      
      console.log("Group fetched:", group);
      await prisma.groupMember.create({
         data: {
            groupId : Number(groupId),
            userId: String(newMemberId),
            role: MEMBER,
         },
      });
      await prisma.chatMember.create({
         data: {
            chatId : Number(group.chatId),
            userId: String(newMemberId),
         },
      });
   } 
   catch (error) 
   {
      return sendError(res ,error);
   }
   
   return res.send(respond);
}




export async function  removeGroupMember(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<null> = { success: true, message: GroupMessages.MEMBER_REMOVED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId, memberId } = req.params as { groupId: string; memberId: string };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId), Number(userId), Number(memberId));

      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role === MEMBER)
         throw new Error(GroupMessages.MEMBER_REMOVED_FAILED);

      const member = group.members.find((m:any) => m.userId === memberId);
      if (!member) 
         throw new Error(GroupMessages.MEMBER_REMOVED_FAILED); 
      
      if(member.role === ADMIN && requester.role !== OWNER)
         throw new Error(GroupMessages.MEMBER_REMOVED_FAILED);

      await prisma.groupMember.delete({
         where: { id: member.id },
      });
      
   }
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);  
}   





export async function  updateMemberRole(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<null> = { success: true, message: GroupMessages.ROLE_UPDATED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId, memberId } = req.params as { groupId: string; memberId: string };
   const { newRole } = req.body as { newRole: 'ADMIN' | 'MEMBER' };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId), Number(userId), Number(memberId));
   
      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role !== OWNER) 
         throw new Error(GroupMessages.ROLE_UPDATED_FAILED); 

      const member = group.members.find((m:any) => m.userId === memberId);
      if (!member || member.role === newRole)
         throw new Error(GroupMessages.ROLE_UPDATED_FAILED);
     
      await prisma.groupMember.update({
         where: { id: member.id },
         data: { role: newRole },
      });

   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);
}






export async function  updateGroupInfo(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<null> = { success: true, message: GroupMessages.UPDATED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };
   const { name , desc } = req.body as { name?: string ; desc?: string };
  
   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId));
      
      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role === MEMBER) 
         throw new Error(GroupMessages.UPDATED_FAILED); 

      await prisma.group.update({
         where: { id: Number(groupId) },
         data: {
            name: name || group.name,
            desc: desc || group.desc,
         },
      });
   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);
}




export async function  listGroupMembers(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<{ members: { userId: string; role: string }[] }> = { success: true, message: GroupMessages.MEMBERS_LISTED_SUCCESS, data: { members: [] } };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId), Number(userId));
      
      const isMember = group.members.some((m:any) => m.userId === userId);
      if (!isMember) 
         throw new Error(GroupMessages.MEMBERS_LISTED_FAILED); 

      respond.data = { members: group.members.map((m:any) => ({ userId: m.userId, role: m.role })) };
   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);
}



export async function  getGroupMessages(req: FastifyRequest, res: FastifyReply) 
{

   const respond: ApiResponse<null> = { success: true, message: GroupMessages.FETCH_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId), Number(userId));
      
      const isMember = group.members.some((m:any) => m.userId === userId);
      if (!isMember) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND); 

      console.log("Group fetched:", group);
      // console.log("Group fetched:", group.chat);
      // const chat = group.chat;

      // respond.data = chat
      
   } 
   catch (error)
   {
      sendError(res ,error);
   }
   return res.send(respond);
}





