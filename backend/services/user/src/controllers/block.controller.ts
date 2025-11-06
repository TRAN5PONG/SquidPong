import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { Profile } from '../utils/types';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { getProfile } from '../utils/utils';
import { iSameUser } from '../utils/utils';
import { BlockMessages , FriendMessages } from '../utils/responseMessages';
import { redis } from '../integration/redis.integration';
import { mergeProfileWithRedis } from '../utils/utils';
import { blockUserInChat , unblockUserInChat } from '../integration/chat.restapi';






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
  const userId = Number(headers['x-user-id']);
  const blockId = Number((req.params as any).blockId);

  console.log("userId:", userId, "blockId:", blockId);
  try 
  {
    await iSameUser(userId , blockId);

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: blockId },
          { senderId: blockId, receiverId: userId },
        ],
        status: ACCEPTED,
      },
    });
    if(!existingFriendship)
      throw new Error(BlockMessages.BLOCK_NO_FRIEND);
    
    console.log("Existing Friendship:", existingFriendship);

    await prisma.friendship.update({
      where: { id: existingFriendship.id},
      data: { senderId: userId, receiverId: blockId, status: BLOCKED},
    });

    // Block user in chat service
    await blockUserInChat(userId, blockId);
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
  const userId = Number(headers['x-user-id']);
  const blockId = Number((req.params as any).blockId);

  
  try 
  {
    await iSameUser(userId , blockId);
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        senderId: userId, receiverId: blockId,
        status: BLOCKED,
      },
    });
    if(!existingFriendship)
      throw new Error(BlockMessages.UNBLOCK_NOT_FOUND);

    await prisma.friendship.update({
      where: { id: existingFriendship.id},
      data: { status: ACCEPTED },
    });

    // Unblock user in chat service
    try {
      await unblockUserInChat(userId, blockId);
      console.log(`Successfully unblocked user ${blockId} in chat for user ${userId}`);
    } catch (chatError) {
      console.error('Failed to unblock user in chat service:', chatError);
      // Continue even if chat service fails - user is already unblocked in DB
    }
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
  const userId = Number(headers['x-user-id']);
  
  try 
  {
    const friendships = await prisma.friendship.findMany({
      where: { senderId: userId, status: BLOCKED }
    });
    const friendIds = friendships.map((f:any) => f.receiverId);
    const profiles = await prisma.profile.findMany({ where: { userId: { in: friendIds } } });
    const mergedProfiles = await Promise.all(profiles.map(mergeProfileWithRedis));
    respond.data = mergedProfiles;
  } 
  catch (error) {
    return sendError(res, error);
  }
  return res.send(respond);
}

