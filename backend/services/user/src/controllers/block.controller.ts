import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { Profile } from '../utils/types';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { getProfile } from '../utils/utils';

import { BlockMessages , FriendMessages } from '../utils/responseMessages';
import { redis } from '../utils/redis';



enum FriendshipStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  BLOCKED = "BLOCKED",
}

const { BLOCKED, ACCEPTED } = FriendshipStatus;

// ----------------- BLOCK USER -----------------
export async function blockUserHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message:  BlockMessages.BLOCK_SUCCESS  };
  
  const headers = req.headers as any;
  const userId = headers['x-user-id'];
  const { blockId } = req.params as any;

  try 
  {
    await getProfile(Number(blockId));

    // Must be friends first to block
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: blockId, status: ACCEPTED },
          { senderId: blockId, receiverId: userId, status: ACCEPTED },
        ],
      },
    });

    if (!friendship) throw new Error(FriendMessages.NOT_FRIENDS);

    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: BLOCKED },
    });

  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}



// ----------------- UNBLOCK USER -----------------
export async function unblockUserHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: BlockMessages.UNBLOCK_SUCCESS  };
  
  const headers = req.headers as any;
  const userId = headers['x-user-id'];
  const { blockId } = req.params as any;

  try 
  {
    await getProfile(Number(blockId));

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: blockId, status: BLOCKED },
          { senderId: blockId, receiverId: userId, status: BLOCKED },
        ],
      },
    });

    if (!friendship) throw new Error(BlockMessages.UNBLOCK_NOT_FOUND);

    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: ACCEPTED },
    });
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}






export async function getBlockedUsersHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<Profile[]> = { success: true, message: FriendMessages.FETCH_SUCCESS };
  const headers = req.headers as any;
  const userId = headers['x-user-id'];

  try 
  {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: BLOCKED,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    const friendIds = friendships.map((f:any) => f.senderId === userId ? f.receiverId : f.senderId);

    const onlineUserIds: string[] = await redis.getOnlineUsers();
    const onlineFriends: Profile[] = [];
  
    for (const friendId of friendIds) 
    {
      if (onlineUserIds.includes(friendId)  ) 
      {
        const profile = await redis.get(`profile:${friendId}`);
        if (profile)
          onlineFriends.push({ ...profile});
      }
    }


    const offlineFriends = await prisma.profile.findMany({
      where: { status: "OFFLINE" }
    });

    const allFriends = [...onlineFriends, ...offlineFriends];

    respond.data = allFriends;
  } 
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}
