import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';
import { PollMessages } from '../utils/RespondMessage';

import {checkUserAndFetchGroup} from '../utils/group.check';

enum GroupRole {
   ADMIN = 'ADMIN',
   MEMBER = 'MEMBER',
   OWNER = 'OWNER',
}

const { ADMIN , MEMBER , OWNER } = GroupRole ;

enum MemberStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED", 
  REJECTED = "REJECTED",
  BANNED = "BANNED",
}

const { PENDING , APPROVED , REJECTED , BANNED } = MemberStatus ;


// Create a new poll in a group
export async function createPoll(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<any> = { success: true, message: PollMessages.POLL_CREATED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };
   const { question, options, content } = req.body as { 
      question: string; 
      options: string[]; 
      content?: string;
   };
   
   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId));
      
      // Check if user is member of the group
      const member = group.members.find((m:any) => m.userId === userId && m.status === APPROVED);
      if (!member) throw new Error('You must be a member of this group to create polls.');

      // Create message first
      const message = await prisma.message.create({
         data: {
            chatId: Number(group.chatId),
            senderId: userId,
            type: 'POLL',
            content: content || `Poll: ${question}`,
         },
      });

      // Create poll
      const poll = await prisma.poll.create({
         data: {
            messageId: message.id,
            question,
            options: {
               create: options.map((optionText: string) => ({
                  text: optionText
               }))
            }
         },
         include: {
            options: true,
            message: true
         }
      });

      respond.data = poll;
   } 
   catch (error) 
   {
      sendError(res, error);
   }
   
   return res.send(respond);
}


// Get all polls in a group
export async function getGroupPolls(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<any> = { success: true, message: PollMessages.POLLS_FETCHED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { groupId } = req.params as { groupId: string };
   
   try 
   {
      const group = await checkUserAndFetchGroup(Number(groupId));
      
      // Check if user is member of the group
      const member = group.members.find((m:any) => m.userId === userId && m.status === APPROVED);
      if (!member) throw new Error('You must be a member of this group to view polls.');

      const polls = await prisma.poll.findMany({
         where: {
            message: {
               chatId: Number(group.chatId)
            }
         },
         include: {
            options: {
               include: {
                  votes: {
                     include: {
                        user: {
                           select: {
                              id: true,
                              username: true
                           }
                        }
                     }
                  }
               }
            },
            message: {
               include: {
                  sender: {
                     select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true
                     }
                  }
               }
            }
         },
         orderBy: {
            createdAt: 'desc'
         }
      });

      respond.data = { polls };
   } 
   catch (error) 
   {
      sendError(res, error);
   }
   
   return res.send(respond);
}


// Get specific poll by ID
export async function getPollById(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<any> = { success: true, message: PollMessages.POLL_FETCHED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { pollId } = req.params as { pollId: string };
   
   try 
   {
      const poll = await prisma.poll.findUnique({
         where: { id: Number(pollId) },
         include: {
            options: {
               include: {
                  votes: {
                     include: {
                        user: {
                           select: {
                              id: true,
                              username: true
                           }
                        }
                     }
                  }
               }
            },
            message: {
               include: {
                  chat: {
                     include: {
                        group: {
                           include: {
                              members: true
                           }
                        }
                     }
                  },
                  sender: {
                     select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true
                     }
                  }
               }
            }
         }
      });

      if (!poll) throw new Error('Poll not found.');

      // Check if user is member of the group
      const group = poll.message.chat.group;
      if (group) {
         const member = group.members.find((m:any) => m.userId === userId && m.status === APPROVED);
         if (!member) throw new Error('You must be a member of this group to view this poll.');
      }

      respond.data = poll;
   } 
   catch (error) 
   {
      sendError(res, error);
   }
   
   return res.send(respond);
}


// Vote on a poll option
export async function votePollOption(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<any> = { success: true, message: PollMessages.VOTE_SUBMITTED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { pollId } = req.params as { pollId: string };
   const { optionId } = req.body as { optionId: number };
   
   try 
   {
      const poll = await prisma.poll.findUnique({
         where: { id: Number(pollId) },
         include: {
            options: true,
            message: {
               include: {
                  chat: {
                     include: {
                        group: {
                           include: {
                              members: true
                           }
                        }
                     }
                  }
               }
            }
         }
      });

      if (!poll) throw new Error('Poll not found.');

      // Check if user is member of the group
      const group = poll.message.chat.group;
      if (group) {
         const member = group.members.find((m:any) => m.userId === userId && m.status === APPROVED);
         if (!member) throw new Error('You must be a member of this group to vote on this poll.');
      }

      // Check if option exists
      const option = poll.options.find(opt => opt.id === optionId);
      if (!option) throw new Error('Poll option not found.');

      // Check if user already voted on this poll (remove previous vote)
      const existingVotes = await prisma.pollVote.findMany({
         where: {
            userId: userId,
            option: {
               pollId: Number(pollId)
            }
         }
      });

      // Remove existing votes for this poll
      if (existingVotes.length > 0) {
         await prisma.pollVote.deleteMany({
            where: {
               userId: userId,
               option: {
                  pollId: Number(pollId)
               }
            }
         });
      }

      // Create new vote
      const vote = await prisma.pollVote.create({
         data: {
            optionId: optionId,
            userId: userId
         },
         include: {
            option: true,
            user: {
               select: {
                  id: true,
                  username: true
               }
            }
         }
      });

      respond.data = vote;
   } 
   catch (error) 
   {
      sendError(res, error);
   }
   
   return res.send(respond);
}


// Add option to existing poll (only poll creator or admins)
export async function addPollOption(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<any> = { success: true, message: PollMessages.OPTION_ADDED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { pollId } = req.params as { pollId: string };
   const { text } = req.body as { text: string };
   
   try 
   {
      const poll = await prisma.poll.findUnique({
         where: { id: Number(pollId) },
         include: {
            message: {
               include: {
                  chat: {
                     include: {
                        group: {
                           include: {
                              members: true
                           }
                        }
                     }
                  }
               }
            }
         }
      });

      if (!poll) throw new Error('Poll not found.');

      // Check if user is creator or admin/owner
      const isCreator = poll.message.senderId === userId;
      const group = poll.message.chat.group;
      let isAdmin = false;
      
      if (group) {
         const member = group.members.find((m:any) => m.userId === userId && m.status === APPROVED);
         if (!member) throw new Error('You must be a member of this group.');
         isAdmin = member.role === ADMIN || member.role === OWNER;
      }

      if (!isCreator && !isAdmin) {
         throw new Error('Only poll creator or group admins can add options.');
      }

      // Create new option
      const option = await prisma.pollOption.create({
         data: {
            pollId: Number(pollId),
            text: text
         }
      });

      respond.data = option;
   } 
   catch (error) 
   {
      sendError(res, error);
   }
   
   return res.send(respond);
}


// Delete poll (only creator or admins)
export async function removePoll(req: FastifyRequest, res: FastifyReply)
{
   const respond: ApiResponse<null> = { success: true, message: PollMessages.POLL_DELETED_SUCCESS };
   const headers = req.headers as { 'x-user-id': string };
   const userId = headers['x-user-id'];

   const { pollId } = req.params as { pollId: string };
   
   try 
   {
      const poll = await prisma.poll.findUnique({
         where: { id: Number(pollId) },
         include: {
            message: {
               include: {
                  chat: {
                     include: {
                        group: {
                           include: {
                              members: true
                           }
                        }
                     }
                  }
               }
            }
         }
      });

      if (!poll) throw new Error('Poll not found.');

      // Check if user is creator or admin/owner
      const isCreator = poll.message.senderId === userId;
      const group = poll.message.chat.group;
      let isAdmin = false;
      
      if (group) {
         const member = group.members.find((m:any) => m.userId === userId && m.status === APPROVED);
         if (!member) throw new Error('You must be a member of this group.');
         isAdmin = member.role === ADMIN || member.role === OWNER;
      }

      if (!isCreator && !isAdmin) {
         throw new Error('Only poll creator or group admins can delete polls.');
      }

      // Delete poll (this will cascade to options and votes)
      await prisma.poll.delete({
         where: { id: Number(pollId) }
      });

      // Delete the message as well
      await prisma.message.delete({
         where: { id: poll.messageId }
      });

   } 
   catch (error) 
   {
      sendError(res, error);
   }
   
   return res.send(respond);
}

