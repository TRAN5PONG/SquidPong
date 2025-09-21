import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';


export async function sendMessageWithAttachment(req: FastifyRequest, res: FastifyReply)
{

}

export async function getChatMessages(req: FastifyRequest, res: FastifyReply)
{

}

export async function removeAttachment(req: FastifyRequest, res: FastifyReply)
{

}   