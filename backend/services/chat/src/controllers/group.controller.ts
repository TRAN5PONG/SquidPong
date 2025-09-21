import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';

import { GroupMessages } from '../utils/RespondMessage';


enum GroupRole {
   ADMIN = 'ADMIN',
   MEMBER = 'MEMBER',
   OWNER = 'OWNER',
}

const { ADMIN , MEMBER , OWNER } = GroupRole ;




export async function  createGroup(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<{groupId : string}> = { success: true, message: GroupMessages.CREATED_SUCCESS };

   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { name  , desc  } = req.body as { name: string; desc: string };

   try 
   {

      // Create group
      const newGroup = await prisma.group.create({
         data: {
            name,
            desc,
            members: {
               create: {
                  userId: userId,
                  role: OWNER,
                  },
               },
           },
       });

      respond.data = { groupId: newGroup.id };

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
      const group = await prisma.group.findUnique({
         where: { id: groupId },
         include: { members: true },
      });

      if (!group) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND);

      const member = group.members.find((m:any) => m.userId === userId);
      if (!member || member.role !== OWNER)
         throw new Error(GroupMessages.DELETED_FAILED); 

      await prisma.group.delete({ where: { id: groupId }});

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
      const group = await prisma.group.findUnique({
         where: { id: groupId },
         include: { members: true },
      });
      
      if (!group) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND);
      const isMember = group.members.some((m:any) => m.userId === userId);
      if (!isMember) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND);

      respond.data = { id: group.id, name: group.name, desc: group.desc, members: group.members.length };

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

   const { groupId } = req.params as { groupId: string };
   const { newMemberId , role } = req.body as { newMemberId: string , role : 'ADMIN' | 'MEMBER' };

   try 
   {
      if (userId === newMemberId) 
         throw new Error(GroupMessages.MEMBER_ADDED_FAILED);
      
      const group = await prisma.group.findUnique({
         where: { id: groupId },
         include: { members: true },
      });
      if (!group) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND);
      
      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role !== ADMIN || requester.role !== OWNER) 
         throw new Error(GroupMessages.MEMBER_ADDED_FAILED); 

      const alreadyMember = group.members.some((m:any) => m.userId === newMemberId);
      if (alreadyMember)
         throw new Error(GroupMessages.MEMBER_ADDED_FAILED); 
      
      await prisma.groupMember.create({
         data: {
            groupId,
            userId: newMemberId,
            role: role,
         },
      });
      
   } 
   catch (error) 
   {
      sendError(res ,error);
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
      if (userId === memberId) 
         throw new Error(GroupMessages.MEMBER_REMOVED_FAILED);
      
      const group = await prisma.group.findUnique({
         where: { id: groupId },
         include: { members: true },
      });
      if (!group) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND);
      

      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role !== ADMIN || requester.role !== OWNER) 
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
      if (userId === memberId) 
         throw new Error(GroupMessages.ROLE_UPDATED_FAILED);
      const group = await prisma.group.findUnique({
         where: { id: groupId },
         include: { members: true },
      });
      if (!group)
         throw new Error(GroupMessages.FETCH_NOT_FOUND);
   
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
      const group = await prisma.group.findUnique({
         where: { id: groupId },
         include: { members: true },
      });
      if (!group) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND);
      
      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || (requester.role !== ADMIN && requester.role !== OWNER)) 
         throw new Error(GroupMessages.UPDATED_FAILED); 

      await prisma.group.update({
         where: { id: groupId },
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
      const group = await prisma.group.findUnique({
         where: { id: groupId },
         include: { members: true },
      });
      if (!group) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND);
      
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
   const respond: ApiResponse<{ messages: Message[] }> = { success: true, message: GroupMessages.FETCH_SUCCESS, data: { messages: [] } };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };

   try 
   {
      const group = await prisma.group.findUnique({
         where: { id: groupId },
         include: { members: true },
      });
      if (!group) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND);
      
      const isMember = group.members.some((m:any) => m.userId === userId);
      if (!isMember) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND); 

      const messages = await prisma.message.findMany({
         where: { groupId },
         orderBy: { createdAt: 'asc' },
      });

      respond.data = { messages: messages as Message[] };
  
   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);
  
}





