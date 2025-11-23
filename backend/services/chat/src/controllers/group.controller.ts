import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';
import { fetchAndEnsureUser } from '../utils/helper';
import { GroupMessages } from '../utils/RespondMessage';
import { checkUserAndFetchGroup } from '../utils/group.check';
import { convertParsedMultipartToJson } from '../utils/helper';



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


enum TypeofGoup {
   PUBLIC_G = 'PUBLIC',
   PRIVATE_G = 'PRIVATE',
}

const { PUBLIC_G , PRIVATE_G } = TypeofGoup ;



export enum MemberStatus {
  PENDING = "PENDING",    // user requested to join
  APPROVED = "APPROVED",  // user is active member
  REJECTED = "REJECTED",  // admin rejected join request
  BANNED = "BANNED",      // user blocked from joining
}

const { PENDING , APPROVED , REJECTED , BANNED } = MemberStatus ;



export async function createGroup(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<any> = { success: true, message: GroupMessages.CREATED_SUCCESS };

   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   let {matchId ,  name, desc, type } = req.body as { name: string; desc: string , type?: TypeofGoup , matchId?: string  };

   try
   {
      if(matchId !== undefined)
      {
         name = `Match Group - ${matchId}`;
         desc = `Group for match ID: ${matchId}`;
         type = PUBLIC_G;
      }

      const group = await prisma.group.create({
         data: {
            name,
            desc,
            matchId,
            type: type || PUBLIC_G,
            members: {
               create: {
                  userId: String(userId),
                  role: OWNER,
                  status: APPROVED,
               },
            },
            chat: {
               create: {
                  type: GROUP,
                  members: {
                     create: {
                        userId: String(userId),
                     },
                  },
               },
            },
         },
         include: {chat: true},
      });

      respond.data = group;
   }
   catch (error) {
      sendError(res ,error);
   }
      
   return res.send(respond);
}




export async function updateGroupInfo(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<null> = { success: true, message: GroupMessages.UPDATED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };
   let { name , desc , type } = req.body as { name?: string ; desc?: string , type?: TypeofGoup  };
  
   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId));
      if(group.matchId) throw new Error(GroupMessages.CANNOT_UPDATE_MATCH_GROUP);

      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role === MEMBER) 
         throw new Error(GroupMessages.NOT_HAVE_PERMISSION); 

      if(type && requester.role !== OWNER)
      {
         respond.message = GroupMessages.NOT_OWNER_CANNOT_CHANGE_TYPE;
         type = group.type as TypeofGoup;
      }

      await prisma.group.update({
         where: { id: Number(groupId) },
         data: {
            ...(name && { name }),
            ...(desc && { desc }),
            ...(type && { type}),
         },
      });
   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);
}



export async function updateGroupImage(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<any> = { success: true, message: GroupMessages.IMAGE_UPDATED_SUCCESS };
   const headers = req.headers as any;
   const userId = Number(headers['x-user-id']);
   
   const { groupId } = req.params as { groupId: string };
   
   try 
   {
    const group = await prisma.group.findUnique({ 
      where: { id: Number(groupId) } , 
      include: { members: true } });
    if (!group) throw new Error(GroupMessages.NOT_FOUND);
   
    if(group.matchId) throw new Error(GroupMessages.CANNOT_UPDATE_MATCH_GROUP);

    const requester = group.members.find((m:any) => m.userId === userId);
    if (!requester || requester.role === MEMBER) throw new Error(GroupMessages.UPDATED_FAILED);
   
    const {imageUrl } = await convertParsedMultipartToJson(req) as {imageUrl: string};
    
    const data = await prisma.group.update({
       where: { id: Number(groupId) },
       data: { imageUrl },
    });
   
    respond.data = data;
   }
   catch (error) {
     return sendError(res, error);
   }
  
   return res.send(respond);
}



export async function updateMember(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<null> = { success: true, message: GroupMessages.ROLE_UPDATED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string};
   const { newRole , memberId } = req.body as { newRole: 'ADMIN' | 'MEMBER' | 'OWNER' , memberId: number   };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId));
   
      if(group.matchId) throw new Error(GroupMessages.CANNOT_UPDATE_MATCH_GROUP);

      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role !== OWNER) throw new Error(GroupMessages.NOT_HAVE_PERMISSION); 

      const member = group.members.find((m:any) => m.userId === String(memberId));
      if (!member) throw new Error(GroupMessages.MEMBER_NOT_EXISTS);
      
      if(requester.role !== OWNER || member.role === newRole) throw new Error(GroupMessages.ROLE_UPDATED_FAILED);

      if(newRole === OWNER)
      {
         await prisma.groupMember.update({
               where : { userId_groupId : { userId , groupId : Number(groupId) } },
               data : {  role : ADMIN }
            });
      }

      await prisma.groupMember.update({
         where: { userId_groupId : { userId : String(memberId) , groupId : Number(groupId) } },
            data: { role : newRole ?? member.role }
      });
   
   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);
}


/** 5️⃣ Remove Member */
export async function removeGroupMember(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<null> = { success: true, message: GroupMessages.MEMBER_REMOVED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId} = req.params as { groupId: string };
   const { memberId } = req.body as { memberId: number  };
   
   try 
   {
      if(memberId === Number(userId)) throw new Error(GroupMessages.MEMBER_REMOVED_FAILED);
      const group = await checkUserAndFetchGroup(Number(groupId));

      if(group.matchId) throw new Error(GroupMessages.CANNOT_UPDATE_MATCH_GROUP);

      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role === MEMBER)
         throw new Error(GroupMessages.MEMBER_REMOVED_FAILED);

      const member = group.members.find((m:any) => m.userId === String(memberId));
      if (!member)  throw new Error(GroupMessages.MEMBER_REMOVED_FAILED); 
      
      if(member.role === ADMIN && requester.role !== OWNER) throw new Error(GroupMessages.MEMBER_REMOVED_FAILED);

      await prisma.groupMember.delete({ where: { id: member.id }});
      await prisma.chatMember.delete({
         where: { chatId_userId: { chatId: Number(group.chatId), userId: String(memberId) } },
      });
      
   }
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);  
}   



/** 6️⃣ Leave Group */
export async function leaveGroup (req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<null> = { success: true, message: GroupMessages.LEFT_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string  };
   const { matchId } = req.params as { matchId?: string  };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId) , matchId );

      const member = group.members.find((m:any) => m.userId === userId);
      if (!member) throw new Error(GroupMessages.NOT_A_MEMBER); 

      if(member.role === OWNER && group.matchId !== undefined && group.matchId !== matchId)
         throw new Error(GroupMessages.CANNOT_LEAVE_OWNER);

      await prisma.groupMember.delete({ where: { id: member.id }});
      await prisma.chatMember.delete({
         where: { chatId_userId: { chatId: Number(group.chatId), userId } },
      });

   } 
   catch (error) 
   {
      sendError(res ,error);
   }

   return res.send(respond);
}



/** 7️⃣ Join Requests (Private Groups) */
export async function requestJoinGroup (req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<null> = { success: true, message: GroupMessages.JOINED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string  };
   const { matchId } = req.params as { matchId?: string  };
   
   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId) , matchId );

      const alreadyMember = group.members.some((m:any) => m.userId === userId);
      if (alreadyMember) throw new Error(GroupMessages.MEMBER_ALREADY_IN_GROUP); 

      if(group.type === PRIVATE_G)
      {
         await prisma.groupMember.create({
            data: {
               groupId: group.id,
               userId, 
               role: MEMBER,
               status: PENDING,
            },
         });

         respond.message = GroupMessages.JOIN_REQUESTS_FETCHED_SUCCESS;
      }
      else
      {
         await prisma.groupMember.create({
            data: {
               groupId: group.id,
               userId,
               role: MEMBER,
               status: APPROVED,
            },
         });

         await prisma.chatMember.create({
            data: {
               chatId : Number(group.chatId),
               userId,
            },
         });
      }

   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);
}


export async function getJoinRequests (req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<any> = { success: true, message: GroupMessages.JOIN_REQUESTS_FETCHED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId));
      
      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role === MEMBER) 
         throw new Error(GroupMessages.NOT_HAVE_PERMISSION); 

      const requests = await prisma.groupMember.findMany({
         where: {
            groupId: Number(groupId),
            status: PENDING,
         },
         select: {
            id: true,
            userId: true,
            status: true,
         },
      });

      respond.data = { requests };
   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);
}


export async function approveJoinRequest (req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<any> = { success: true, message: GroupMessages.JOIN_REQUEST_APPROVED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };
   const { memberId } = req.body as { memberId: number  };
   
   try 
   {
      const user = await fetchAndEnsureUser(String(memberId));
      const group = await checkUserAndFetchGroup(Number(groupId));
      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role === MEMBER) 
         throw new Error(GroupMessages.NOT_HAVE_PERMISSION); 

      const request = await prisma.groupMember.findUnique({
         where: { userId_groupId: { userId: String(memberId), groupId: Number(groupId) }   },
      });
      if (!request || request.status !== PENDING || request.groupId !== Number(groupId)) 
         throw new Error(GroupMessages.JOIN_REQUEST_NOT_FOUND);
      
      await prisma.groupMember.update({
         where: { userId_groupId: { userId: String(memberId), groupId: Number(groupId) } },
         data: { status: APPROVED },
      });

      await prisma.chatMember.create({
         data: {
            chatId : Number(group.chatId),
            userId: String(memberId),
         },
      });

   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);
}


export async function rejectJoinRequest (req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<any> = { success: true, message: GroupMessages.JOIN_REQUEST_REJECTED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };
   const { memberId } = req.body as { memberId: number  };
   
   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId));
      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role === MEMBER) 
         throw new Error(GroupMessages.NOT_HAVE_PERMISSION); 

      const request = await prisma.groupMember.findUnique({
         where: { userId_groupId: { userId: String(memberId), groupId: Number(groupId) }   },
      });
      if (!request || request.status !== PENDING || request.groupId !== Number(groupId)) 
         throw new Error(GroupMessages.JOIN_REQUEST_NOT_FOUND);
      
      await prisma.groupMember.delete({
         where: { userId_groupId: { userId: String(memberId), groupId: Number(groupId) }  },
      });


   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   return res.send(respond);
}



export async function getGroupById(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<any> = { success: true, message: GroupMessages.FETCH_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };
   const { matchId } = req.params as { matchId?: string  };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId) , matchId );

      const isMember = group.members.some((m:any) => m.userId === userId);
      if (!isMember) 
         respond.data = {name: group.name, desc: group.desc, type: group.type, members: group.members.length };
      else
         respond.data = group;
   } 
   catch (error) {
      sendError(res ,error);
   }

   return res.send(respond);
}



export async function listGroupMembers(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<{ members: { userId: string; role: string }[] }> = { success: true, message: GroupMessages.MEMBERS_LISTED_SUCCESS, data: { members: [] } };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };
   const { matchId } = req.params as { matchId?: string  };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId) , matchId );
      
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


export async function getGoupes (req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<any> = { success: true, message: GroupMessages.FETCH_SUCCESS, data: { groups: [] } };
   const { search } = req.query as { search?: string };

   try 
   {
      const groups = await prisma.group.findMany({
        where: {
          name: { startsWith: search ?? ''},
        },
        include: { members: true },
      });

      respond.data = groups;
   } 
   catch (error) 
   {
      sendError(res ,error);
   }
   
   return res.send(respond);
}


/** 9️⃣ Messages */
export async function getGroupMessages(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<any> = { success: true, message: GroupMessages.FETCH_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };
   const { matchId } = req.params as { matchId?: string  };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId) , matchId );
      
      const isMember = group.members.some((m:any) => m.userId === userId);
      if (!isMember) 
         throw new Error(GroupMessages.FETCH_NOT_FOUND); 

      respond.data = group;
   } 
   catch (error)
   {
      sendError(res ,error);
   }
   return res.send(respond);
}


/** 🔟 Delete Group */
export async function removeGroup(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<null> = { success: true, message: GroupMessages.DELETED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };

   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId));
      if(group.matchId) throw new Error(GroupMessages.CANNOT_UPDATE_MATCH_GROUP);
      
      const member = group.members.find((m:any) => m.userId === userId);
      if (!member || member.role !== OWNER)
         throw new Error(GroupMessages.DELETED_FAILED); 

      await prisma.group.delete({ where: { id: Number(groupId) } });
      await prisma.chat.delete({ where: { id: Number(group.chatId) } });

   } 
   catch (error) 
   {
      sendError(res ,error);
   }

   return res.send(respond);
}


/** 🆕 Admin/Owner Invite User to Group */
export async function inviteUserToGroup(req: FastifyRequest, res: FastifyReply) 
{
   const respond: ApiResponse<any> = { success: true, message: GroupMessages.USER_INVITED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };
   const { targetUserId } = req.body as { targetUserId: string };
   
   try 
   {
      const targetUser = await fetchAndEnsureUser(targetUserId);
      const group = await checkUserAndFetchGroup(Number(groupId));
      
      const requester = group.members.find((m:any) => m.userId === userId);
      if (!requester || requester.role === MEMBER) 
         throw new Error(GroupMessages.NOT_HAVE_PERMISSION);

      const alreadyMember = group.members.some((m:any) => m.userId === targetUserId);
      if (alreadyMember) throw new Error(GroupMessages.MEMBER_ALREADY_IN_GROUP);

      await prisma.groupMember.create({
         data: {
            groupId: Number(groupId),
            userId: targetUserId,
            role: MEMBER,
            status: APPROVED,
         },
      });

      // Add to chat as well
      await prisma.chatMember.create({
         data: {
            chatId: Number(group.chatId),
            userId: targetUserId,
         },
      });

      respond.data = { invitedUser: targetUser.username, groupName: group.name };
   } 
   catch (error) 
   {
      sendError(res, error);
   }
   
   return res.send(respond);
}
