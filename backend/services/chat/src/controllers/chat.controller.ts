import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';

export async function sayhello(req: FastifyRequest, res: FastifyReply) 
{
    res.send({message: "hello from chat service"});
}


export async function createChat(req: FastifyRequest, res: FastifyReply) 
{

}

export async function removeChat(req: FastifyRequest, res: FastifyReply) 
{

}

export async function getChatById(req: FastifyRequest, res: FastifyReply) 
{

}

export async function getUserChats(req: FastifyRequest, res: FastifyReply) 
{

}

export async function addChatMember(req: FastifyRequest, res: FastifyReply) 
{

}

export async function removeChatMember(req: FastifyRequest, res: FastifyReply) 
{

}