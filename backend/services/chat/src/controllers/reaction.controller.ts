import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Reaction  } from '../utils/RespondMessage';





export async function ReactionsForMessage(req: FastifyRequest, res: FastifyReply)
{
    const respond: ApiResponse<any> = { success: true, message: Reaction.REACTIONS_FETCHED };
    const headers = req.headers as { 'x-user-id': string };
    const userId = headers['x-user-id'];
    
    const {messageId} = req.params as {messageId: string};

    try 
    {
        const message = await prisma.message.findUnique({
            where: { id: Number(messageId) },
            include: { chat: true },
        });

        if (!message) throw new Error('Message not found');

        const isMember = await prisma.chatMember.findFirst({
            where: {
                chatId: message.chatId,
                userId,
            },
        });

        if (!isMember) throw new Error('You are not a member of this chat');

        const reactions = await prisma.reaction.findMany({
            where: { Number(messageId) },
        });

        respond.data = reactions;
    } 
    catch (error) {
        return sendError(res, error);
    }

    return res.send(respond);
}