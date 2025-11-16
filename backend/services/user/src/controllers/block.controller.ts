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

const { BLOCKED, ACCEPTED, PENDING } = FriendshipStatus;

// Helper function to check if any block exists between two users
async function hasBlockBetweenUsers(userId: number, targetId: number): Promise<boolean> 
{
  const blocks = await prisma.blockedUser.findMany({
    where: {
      OR: [
        { blockerId: userId, blockedId: targetId, isBlocked: true },
        { blockerId: targetId, blockedId: userId, isBlocked: true },
      ],
    },
  });
  return blocks.length > 0;
}

// Helper function to check if user has blocked target
async function hasUserBlockedTarget(blockerId: number, blockedId: number): Promise<boolean> 
{
  const block = await prisma.blockedUser.findUnique({
    where: {
      blockerId_blockedId: { blockerId, blockedId },
    },
  });
  return block !== null && block.isBlocked;
}


// ----------------- BLOCK USER -----------------
export async function blockUserHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message:  BlockMessages.BLOCK_SUCCESS  };
  
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  const blockId = Number((req.params as any).blockId);

  try 
  {
    if(userId === blockId) throw new Error(BlockMessages.BLOCK_FAILED + ' You cannot block yourself.');

    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId: blockId },
      },
    });

    if (existingBlock && existingBlock.isBlocked)
      throw new Error(BlockMessages.BLOCK_FAILED + ' You already blocked this user.');

    await prisma.blockedUser.create({
      data: { 
        blockerId: userId, 
        blockedId: blockId, 
        isBlocked: true,
      },
    });

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: blockId },
          { senderId: blockId, receiverId: userId },
        ],
      },
    });

    if (friendship) 
    {
      await prisma.friendship.update({ 
        where: { id: friendship.id },
        data: { status: BLOCKED }
      });
    }

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
    await iSameUser(userId, blockId);
    
    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId: blockId },
      },
    });
    
    if (!existingBlock || !existingBlock.isBlocked)
      throw new Error(BlockMessages.UNBLOCK_NOT_FOUND);

    await prisma.blockedUser.update({
      where: {
        blockerId_blockedId: { blockerId: userId, blockedId: blockId },
      },
      data: { isBlocked: false},
    });

    const reverseBlock = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: { blockerId: blockId, blockedId: userId },
      },
    });

    const isStillBlockedByOther = reverseBlock && reverseBlock.isBlocked;

    if (!isStillBlockedByOther) 
    {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: blockId },
            { senderId: blockId, receiverId: userId },
          ],
          status: BLOCKED,
        },
      });

      if (friendship) 
      {
        await prisma.friendship.update({ 
          where: { id: friendship.id },
          data: { status: ACCEPTED }
        });
      }
    }
    // else: if other user still has us blocked, keep friendship as BLOCKED

    await unblockUserInChat(userId, blockId);
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}



export async function getBlockedUsersHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: FriendMessages.BLOCK_FETCH_SUCCESS , data: null  };
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  
  try 
  {
    const blockedRecords = await prisma.blockedUser.findMany({
      where: { 
        blockerId: userId,
        isBlocked: true,
      }
    });

    const blockedUserIds = blockedRecords.map((record: any) => record.blockedId);
    const profiles = await prisma.profile.findMany({ 
      where: { userId: { in: blockedUserIds } } 
    });
    const mergedProfiles = await Promise.all(profiles.map(mergeProfileWithRedis));
    respond.data = mergedProfiles;
  } 
  catch (error) {
    return sendError(res, error);
  }
  return res.send(respond);
}


// ----------------- GET USERS WHO BLOCKED ME -----------------
export async function getUsersWhoBlockedMeHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { 
    success: true, 
    message: "Users who blocked you fetched successfully", 
    data: null 
  };
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  
  try 
  {
    // Find all users who have blocked the current user
    const blockRecords = await prisma.blockedUser.findMany({
      where: { 
        blockedId: userId,
        isBlocked: true,
      }
    });

    const blockerUserIds = blockRecords.map((record: any) => record.blockerId);
    
    const profiles = await prisma.profile.findMany({ 
      where: { userId: { in: blockerUserIds } } 
    });
    const mergedProfiles = await Promise.all(profiles.map(mergeProfileWithRedis));
    respond.data = mergedProfiles;
  } 
  catch (error) {
    return sendError(res, error);
  }
  return res.send(respond);
}


// ----------------- CHECK IF INTERACTION IS ALLOWED -----------------
// Helper endpoint for other services to check if interaction is allowed
export async function checkInteractionAllowedHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<{ allowed: boolean, reason?: string }> = { 
    success: true, 
    message: "Interaction check completed",
    data: { allowed: true }
  };
  
  const { senderId, receiverId } = req.body as { senderId: number; receiverId: number };
  
  try 
  {
    const hasBlock = await hasBlockBetweenUsers(senderId, receiverId);
    
    if (hasBlock) 
    {
      respond.data = { 
        allowed: false, 
        reason: "Blocked: One or both users have blocked each other" 
      };
    }
  } 
  catch (error) {
    return sendError(res, error);
  }
  
  return res.send(respond);
}


// Export helper functions for use in other controllers
export { hasBlockBetweenUsers, hasUserBlockedTarget };

