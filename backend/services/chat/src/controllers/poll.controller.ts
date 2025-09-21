import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';


export async function createPoll(req: FastifyRequest, res: FastifyReply) 
{

}

export async function getGroupPolls(req: FastifyRequest, res: FastifyReply) 
{
    
}

export async function getPollById(req: FastifyRequest, res: FastifyReply) 
{

}

export async function addPollOption(req: FastifyRequest, res: FastifyReply) 
{

}

export async function votePollOption(req: FastifyRequest, res: FastifyReply) 
{

}

export async function removePoll(req: FastifyRequest, res: FastifyReply) 
{

}