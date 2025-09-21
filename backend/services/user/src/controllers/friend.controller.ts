import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { Profile } from '../utils/types';
import { getProfile } from '../utils/utils';
import { sendDataToQueue } from '../integration/rabbitmqClient';
import { redis } from '../utils/redis';
import { FriendMessages , ProfileMessages } from '../utils/responseMessages';

enum FriendshipStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  BLOCKED = "BLOCKED",
}

const {PENDING, ACCEPTED} = FriendshipStatus;



export async function getFriendsListHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<Profile[]> = { success: true, message: FriendMessages.FETCH_SUCCESS };
  const headers = req.headers as any;
  const userId = headers['x-user-id'];

  try 
  {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: ACCEPTED,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    const friendIds = friendships.map((f:any) => f.senderId === userId ? f.receiverId : f.senderId);

    const onlineUserIds: string[] = await redis.getOnlineUsers();
    const onlineFriends: Profile[] = [];
    // ----------------- FETCH ONLINE FRIENDS FROM REDIS -----------------
    for (const friendId of friendIds) 
    {
      if (onlineUserIds.includes(friendId)) 
      {
        const profile = await redis.get(`profile:${friendId}`);
        if (profile)
          onlineFriends.push({ ...profile});
      }
    }

    // ----------------- FETCH OFFLINE FRIENDS FROM DATABASE -----------------

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



export async function getPendingRequestsHandler(req: FastifyRequest, res: FastifyReply) {
  const respond: ApiResponse<Profile[]> = { success: true, message: FriendMessages.PENDING_FETCH_SUCCESS };
  const headers = req.headers as any;
  const userId = headers['x-user-id'];

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

    const pendingIds = friendships.map((f:any) => f.senderId === userId ? f.receiverId : f.senderId);

    const requests = await prisma.profile.findMany({
      where: { id: { in: pendingIds } }
    });

    respond.data = requests;
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

  const { receiverId } = req.body as any;
  const senderId = headers['x-user-id'];

  try 
  {
    const exists = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ]
      }
    });

    if (exists) throw new Error(FriendMessages.ADD_ALREADY_EXISTS);

    await prisma.friendship.create({
      data: { senderId, receiverId, status: PENDING },
    });

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
  const { senderId } = req.body as any;
  const receiverId = headers['x-user-id'];

  try 
  {

    const friendship = await prisma.friendship.findFirst({
      where: { senderId, receiverId, status: PENDING },
    });

    if (!friendship) throw new Error(FriendMessages.ACCEPT_NOT_FOUND);

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


// ----------------- REJECT FRIEND REQUEST -----------------
export async function rejectFriendRequestHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: FriendMessages.REJECT_SUCCESS };
  const headers = req.headers as any;
  const { senderId } = req.body as any;
  const receiverId = headers['x-user-id'];

  try 
  {
    const friendship = await prisma.friendship.findFirst({
      where: { senderId, receiverId, status: PENDING },
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
  const { senderId } = req.params as any;
  const receiverId = headers['x-user-id'];

  try 
  {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: ACCEPTED },
          { senderId: receiverId, receiverId: senderId, status: ACCEPTED },
        ]
      }
    });

    if (!friendship) throw new Error(FriendMessages.REMOVE_NOT_FOUND);
    await prisma.friendship.delete({ where: { id: friendship.id } });
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}

// ----------------- CANCEL FRIEND REQUEST -----------------
export async function cancelFriendRequestHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: FriendMessages.CANCEL_SUCCESS };
  const headers = req.headers as any;
  const { receiverId } = req.body as any;
  const senderId = headers['x-user-id'];

  try 
  {

    const friendship = await prisma.friendship.findFirst({
      where: { senderId, receiverId, status: PENDING },
    });

    if (!friendship) throw new Error(FriendMessages.CANCEL_NOT_FOUND);

    await prisma.friendship.delete({ where: { id: friendship.id } });
  } 
  catch (error) {
    sendError(res, error);
  }

  return res.send(respond);
}



// ----------------- VERIFY FRIENDSHIP -----------------
export async function verifyFriendshipHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<{ areFriends: boolean }> = { success: true, message: FriendMessages.FRIENDSHIP_VERIFY_SUCCESS, data: { areFriends: false }};

  console.log("Received verify friendship request with query:", req.query);
  try 
  {
    const { senderId, receiverId } = req.query as { senderId: string; receiverId: string };

    // if (!senderId || !receiverId) 
    // {
    //   return res.status(400).send({
    //     success: false,
    //     message: 'Both senderId and receiverId must be provided.',
    //   });
    // }

    await getProfile(Number(senderId));
    await getProfile(Number(receiverId));

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: ACCEPTED },
          { senderId: receiverId, receiverId: senderId, status: ACCEPTED },
        ],
      },
    });

    respond.data.areFriends = Boolean(friendship);
  } 
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}
