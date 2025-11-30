import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { Profile } from '../utils/types';
import { getProfile } from '../utils/utils';
import { sendDataToQueue } from '../integration/rabbitmq.integration';
import { FriendMessages , ProfileMessages } from '../utils/responseMessages';
import { iSameUser} from '../utils/utils';
import { removeFriendFromChat } from '../integration/chat.restapi';

// Import block checking helpers
import { hasBlockBetweenUsers } from './block.controller';

enum FriendshipStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  BLOCKED = "BLOCKED",
}

const {PENDING, ACCEPTED} = FriendshipStatus;



export async function getFriendsListHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any[]> = { success: true, message: FriendMessages.FETCH_SUCCESS };
  const { username } = req.params as { username: string };
  try 
  {
    const profile = await prisma.profile.findUnique({ where: { username }, select: { userId: true } });
    if (!profile) throw new Error(ProfileMessages.NOT_FOUND);
    const userId = profile.userId;
    const friendships = await prisma.friendship.findMany({
      where: {
        status: ACCEPTED,
        OR: [
          { senderId: Number(userId) },
          { receiverId: Number(userId) }
        ]
      }
    });
    const friendIds = friendships.map((f:any) => f.senderId === Number(userId) ? f.receiverId : f.senderId);
    const profiles = await prisma.profile.findMany({ where: { userId: { in: friendIds } } });
    
    console.log('profiles from DB:', profiles);
    respond.data = profiles;
  } 
  catch (error) {
    return sendError(res, error);
  }
  return res.send(respond);
}


export async function getPendingRequestsHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<{ sent: Profile[]; received: Profile[] }> = {  success: true,   message: FriendMessages.PENDING_FETCH_SUCCESS,  data: { sent: [], received: [] }};
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  
  try 
  {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: PENDING,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });
    const sentIds: number[] = [];
    const receivedIds: number[] = [];
    friendships.forEach((f:any) => {
      (f.senderId === userId) ? sentIds.push(f.receiverId) : receivedIds.push(f.senderId);
    });
    const allIds = [...sentIds, ...receivedIds];
    const profiles = await prisma.profile.findMany({ where: { userId: { in: allIds } } });
    // Removed Redis merge
    respond.data.sent = profiles.filter((p:any) => sentIds.includes(p.userId));
    respond.data.received = profiles.filter((p:any) => receivedIds.includes(p.userId));
  } 
  catch (error) {
    return sendError(res, error);
  }
  return res.send(respond);
}


// ----------------- SEND FRIEND REQUEST -----------------
export async function sendFriendRequestHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message:  FriendMessages.ADD_SUCCESS };
  
  const headers = req.headers as any;
  const senderId = Number(headers['x-user-id']);
  
  const { receiverId } = req.body as { receiverId: number };

  try 
  {
    await iSameUser(senderId , receiverId);

    // Check if any block exists between users
    const hasBlock = await hasBlockBetweenUsers(senderId, receiverId);
    if (hasBlock)
      throw new Error(FriendMessages.ADD_FAILED + ' Cannot send friend request to blocked user.');

    const exists = await prisma.friendship.findFirst({
      where : {
        OR : [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });
    if (exists) throw new Error(`${exists.senderId === senderId ? 'Friend request already sent' : 'You are already friends or have a pending request'}`);
    
    await prisma.friendship.create({ data: { senderId, receiverId, status: PENDING }});
    
    const dataToSend = { type: 'friendRequest',  targetId : receiverId , fromId : senderId };
    await sendDataToQueue(dataToSend , 'eventhub');
    
  }
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}


// ----------------- ACCEPT FRIEND REQUEST -----------------
export async function acceptFriendRequestHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: FriendMessages.ACCEPT_SUCCESS };
  const headers = req.headers as any;
  const receiverId = Number(headers['x-user-id']);

  const { senderId } = req.body as { senderId: number };

  try 
  {
    await iSameUser(receiverId , senderId);
    const friendship = await prisma.friendship.findFirst({
      where: { senderId, receiverId, status: PENDING }
    });
    if (!friendship) throw new Error(FriendMessages.ACCEPT_NOT_FOUND);
    
    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: ACCEPTED },
    });
    const dataToSend = { type: 'friendRequestAccepted',  targetId : senderId , fromId : receiverId};
    await sendDataToQueue(dataToSend , 'eventhub');
    
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}


// ----------------- REJECT FRIEND REQUEST -----------------
export async function rejectFriendRequestHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: FriendMessages.REJECT_SUCCESS };
  const headers = req.headers as any;
  const receiverId = Number(headers['x-user-id']);
  
  const { senderId } = req.body as { senderId: number };
  
  try 
  {
    await iSameUser(receiverId , senderId);
    const friendship = await prisma.friendship.findFirst({
      where: { senderId, receiverId, status: PENDING }
    });
    if (!friendship) throw new Error(FriendMessages.REJECT_NOT_FOUND);

    await prisma.friendship.delete({ where: { id: friendship.id } });
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

// ----------------- REMOVE FRIEND -----------------
export async function removeFriendHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: FriendMessages.REMOVE_SUCCESS };
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);

  const { friendId } = req.params as { friendId: string };

  try 
  {
    await iSameUser(userId , Number(friendId));
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: ACCEPTED,
        OR: [
          { senderId: userId, receiverId: Number(friendId) },
          { senderId: Number(friendId), receiverId: userId }
        ]
      }
    });

    if (!friendship) throw new Error(FriendMessages.REMOVE_NOT_FOUND);
    await prisma.friendship.delete({ where: { id: friendship.id } });

    // Remove friend from chat service
    await removeFriendFromChat(userId, Number(friendId));
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function cancelFriendRequestHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: FriendMessages.CANCEL_SUCCESS };
  const headers = req.headers as any;
  const senderId = Number(headers['x-user-id']);

  const { receiverId } = req.body as { receiverId: number };

  try 
  {
    await iSameUser(senderId , receiverId);

    const friendship = await prisma.friendship.findFirst({
      where: { senderId, receiverId, status: PENDING }
    });
    if (!friendship) throw new Error(FriendMessages.CANCEL_NOT_FOUND);
    
    await prisma.friendship.delete({ where: { id: friendship.id }});
    
  }
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}


// ----------------- VERIFY FRIENDSHIP -----------------
export async function verifyFriendshipHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<{ areFriends: boolean }> = { success: true, message: FriendMessages.FRIENDSHIP_VERIFY_SUCCESS, data: { areFriends: false }};

  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  const {friendId} = req.params as { friendId: string };

  const secretToken = headers['x-secret-token'];
  try 
  {

    if (secretToken != process.env.SECRET_TOKEN)
      throw new Error('Unauthorized');

    await iSameUser(userId , Number(friendId));


    const friendship = await prisma.friendship.findFirst({
      where: {
        status: ACCEPTED,
        OR: [
          { senderId: userId, receiverId: Number(friendId) },
          { senderId: Number(friendId), receiverId: userId }
        ]
      }
    });

    respond.data.areFriends = Boolean(friendship);
  } 
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}


export async function getAllFriendsOfUserHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<Profile[]> = { success: true, message: FriendMessages.FETCH_SUCCESS, data: [] };
  const { userId } = req.params as { userId: string };

  try 
  {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: ACCEPTED,
        OR: [
          { senderId: Number(userId) },
          { receiverId: Number(userId) }
        ]
      }
    });
    console.log('friendships:', friendships);
    const friendIds = friendships.map((f:any) => f.senderId === Number(userId) ? f.receiverId : f.senderId);
    const profiles = await prisma.profile.findMany({ where: { userId: { in: friendIds } } });
    
    respond.data = profiles;
  } 
  catch (error) {
    return sendError(res, error);
  }
  return res.send(respond);
}