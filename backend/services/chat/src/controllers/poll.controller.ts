import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';
import { PollMessages } from '../utils/RespondMessage';

import {checkUserAndFetchGroup} from '../utils/group.check';

// export async function createPoll(req: FastifyRequest, res: FastifyReply) 
// {
//    const respond: ApiResponse<any> = { success: true, message: PollMessages.POLL_CREATED_SUCCESS };

//    const headers = req.headers as { 'x-user-id': string };
//    const userId = Number(headers['x-user-id']);

//    const { groupId } = req.params as { groupId: string };
//    const { question, options } = req.body as { question: string; options: string[] };

//    try 
//    {
//       const group = await checkUserAndFetchGroup(userId, Number(groupId));
      
//       const isMember = group.members.some((m:any) => m.userId === userId);
//          if (!isMember) throw new Error("User is not a member of the group");

//       const newPoll = await prisma.poll.create({
//           data: {
//               question,
//               groupId: Number(groupId),
//               createdBy: userId,
//               options: {
//                   create : options.map(option => ({ text: option }))
//               }
//           },
//           include: { options: true }
//       });

//       respond.data = newPoll;
//    } 
//    catch (error) 
//    {
//       return sendError(res ,error);
//    }
      
//    return res.send(respond);  
// }



// export async function getGroupPolls(req: FastifyRequest, res: FastifyReply) 
// {
//    const respond: ApiResponse<any> = { success: true, message: PollMessages.POLLS_FETCHED_SUCCESS };

//    const headers = req.headers as { 'x-user-id': string };
//    const userId = Number(headers['x-user-id']);

//    const { groupId } = req.params as { groupId: string };

//    try 
//    {
//       const group = await checkUserAndFetchGroup(userId, Number(groupId));
      
//       const isMember = group.members.some((m:any) => m.userId === userId);
//          if (!isMember) throw new Error("User is not a member of the group");

//       const polls = await prisma.poll.findMany({
//           where: { groupId: Number(groupId) },
//           include: { options: true }
//       });
      
//       respond.data = polls;
//    } 
//    catch (error) 
//    {
//       return sendError(res ,error);
//    }
      
//    return res.send(respond); 
    
// }

// export async function getPollById(req: FastifyRequest, res: FastifyReply) 
// {
//    const respond: ApiResponse<any> = { success: true, message: PollMessages.POLL_FETCHED_SUCCESS };

//    const headers = req.headers as { 'x-user-id': string };
//    const userId = Number(headers['x-user-id']);

//    const { pollId } = req.params as { pollId: string };
   
//    try 
//    {
//       const poll = await prisma.poll.findUnique({
//          where: { id: Number(pollId) },
//          include: { options: true, group: { include: { members: true } } }
//       });
//          if (!poll) throw new Error("Poll not found");
//       const isMember = poll.group.members.some((m:any) => m.userId === userId);
//          if (!isMember) throw new Error("User is not a member of the group");

//       respond.data = poll;
//    } 
//    catch (error) 
//    {
//       return sendError(res ,error);
//    }
      
//    return res.send(respond);

// }

// export async function addPollOption(req: FastifyRequest, res: FastifyReply) 
// {

// }


// export async function votePollOption(req: FastifyRequest, res: FastifyReply) 
// {
//    const respond: ApiResponse<any> = { success: true, message: PollMessages.VOTE_SUBMITTED_SUCCESS };

//    const headers = req.headers as { 'x-user-id': string };
//    const userId = Number(headers['x-user-id']);

//    const { pollId } = req.params as { pollId: string };
//    const { optionId } = req.body as { optionId: number };

//    try 
//    {
//       const poll = await prisma.poll.findUnique({
//           where: { id: Number(pollId) },
//           include: { options: true, group: { include: { members: true } } }
//       });
//       if (!poll) return sendError(res, "Poll not found");
//       const isMember = poll.group.members.some((m:any) => m.userId === userId);
//          if (!isMember) throw new Error("User is not a member of the group");

//       const option = poll.options.find((o:any) => o.id === optionId);
//          if (!option) throw new Error("Option not found in the poll");

//       await prisma.vote.upsert({
//           where: {
//               pollOptionId_userId: {
//                   pollOptionId: optionId,
//                   userId: userId
//               }
//           },
//           update: {},
//           create: {
//             pollOptionId: optionId,
//             userId: userId
//           }
//       });

//    } 
//    catch (error) 
//    {
//       return sendError(res ,error);
//    }
      
//    return res.send(respond);

// }



// export async function removePoll(req: FastifyRequest, res: FastifyReply) 
// {
//    const respond: ApiResponse<any> = { success: true, message: "Poll removed successfully" };
//    const headers = req.headers as { 'x-user-id': string };
//    const userId = Number(headers['x-user-id']);

//    const { pollId } = req.params as { pollId: string };

//    try 
//    {
//       const poll = await prisma.poll.findUnique({
//           where: { id: Number(pollId) },
//           include: { group: { include: { members: true } } }
//       });
//       if (!poll) throw new Error("Poll not found");
//       const isMember = poll.group.members.some((m:any) => m.userId === userId);
//          if (!isMember) throw new Error("User is not a member of the group");

//       if (poll.createdBy !== userId) throw new Error("Only the poll creator can delete the poll");

//       await prisma.poll.delete({ where: { id: Number(pollId) } });

//    } 
//    catch (error) 
//    {
//       return sendError(res ,error);
//    }
      
//    return res.send(respond);     

// }