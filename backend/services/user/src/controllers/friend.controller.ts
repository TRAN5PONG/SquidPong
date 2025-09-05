import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse } from '../utils/errorHandler';
import { Profile } from '../utils/types';
import { getProfileId } from '../utils/utils';
import { sendDataToQueue } from '../integration/rabbitmqClient';


enum FriendshipStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  BLOCKED = "BLOCKED",
}

const {PENDING, ACCEPTED} = FriendshipStatus;

// ----------------- GET FRIENDS -----------------
export async function getFriendsListHandler(req: FastifyRequest, res: FastifyReply)
{

  const respond: ApiResponse<Profile[]> = { success: true, message: 'get friends success' };
  const headers = req.headers as any;

  try 
  {
    const userId = Number(headers['x-user-id']);
    const profileId = await getProfileId(userId);

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        sentFriendRequests: {
          where: { status: ACCEPTED },
          include: { receiver: true },
        },
        receivedFriendRequests: {
          where: { status: ACCEPTED },
          include: { sender: true },
        },
      },
    });

    if (!profile) throw new Error('Profile not found');

    const friends = [
      ...profile.sentFriendRequests.map(f => f.receiver),
      ...profile.receivedFriendRequests.map(f => f.sender),
    ];

    respond.data = friends;
  } 
  catch (error) 
  {
    respond.success = false;
    respond.message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).send(respond);
  }

  return res.send(respond);
}


// ----------------- GET PENDING REQUESTS -----------------
export async function getPendingRequestsHandler(req: FastifyRequest, res: FastifyReply) 
{

  const respond: ApiResponse<Profile[]> = { success: true, message: 'get pending requests success' };
  const headers = req.headers as any;

  try 
  {
    const userId = Number(headers['x-user-id']);
    const profileId = await getProfileId(userId);

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        sentFriendRequests: {
          where: { status: PENDING },
          include: { receiver: true },
        },
        receivedFriendRequests: {
          where: { status: PENDING },
          include: { sender: true },
        },
      },
    });

    if (!profile) throw new Error('Profile not found');

    const requests = [
      ...profile.sentFriendRequests.map(f => f.receiver),
      ...profile.receivedFriendRequests.map(f => f.sender),
    ];

    respond.data = requests;
  } 
  catch (error) 
  {
    respond.success = false;
    respond.message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).send(respond);
  }

  return res.send(respond);
}


// ----------------- SEND FRIEND REQUEST -----------------
export async function sendFriendRequestHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'friend request sent' };
  const headers = req.headers as any;
  const { receiverId: receiverUserId } = req.body as any;

  try 
  {
    const senderId = await getProfileId(Number(headers['x-user-id']));
    const receiverId = await getProfileId(Number(receiverUserId));

    const exists = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (exists) throw new Error('Friend request already exists');

    await prisma.friendship.create({
      data: { senderId, receiverId, status: PENDING },
    });

  } 
  catch (error) 
  {
    respond.success = false;
    respond.message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).send(respond);
  }

  // await sendDataToQueue({from : headers['x-user-id'] , to : receiverUserId , message  : "send request friends" } , 'friends');
  return res.send(respond);
}


// ----------------- ACCEPT FRIEND REQUEST -----------------
export async function acceptFriendRequestHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'friend request accepted' };
  const headers = req.headers as any;
  const { senderId: senderUserId } = req.body as any;

  try 
  {
    const receiverId = await getProfileId(Number(headers['x-user-id']));
    const senderId = await getProfileId(Number(senderUserId));

    const friendship = await prisma.friendship.findFirst({
      where: { senderId, receiverId, status: PENDING },
    });

    if (!friendship) throw new Error('No pending friend request found');

    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: ACCEPTED },
    });

  } 
  catch (error) 
  {
    respond.success = false;
    respond.message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).send(respond);
  }
  
  // await sendDataToQueue({from : headers['x-user-id'] , to : senderUserId , message  : "accept request friends" } , 'friends');
  return res.send(respond);
}



// ----------------- REJECT FRIEND REQUEST -----------------
export async function rejectFriendRequestHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'friend request rejected' };
  const headers = req.headers as any;
  const { senderId: senderUserId } = req.body as any;

  try 
  {
    const receiverId = await getProfileId(Number(headers['x-user-id']));
    const senderId = await getProfileId(Number(senderUserId));

    const friendship = await prisma.friendship.findFirst({
      where: { senderId, receiverId, status: PENDING },
    });

    if (!friendship) throw new Error('No pending friend request found to reject');

    await prisma.friendship.delete({ where: { id: friendship.id } });

  } 
  catch (error) 
  {
    respond.success = false;
    respond.message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).send(respond);
  }

  return res.send(respond);
}


// ----------------- REMOVE FRIEND -----------------
export async function removeFriendHandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<null> = { success: true, message: 'Friend removed successfully' };
  const headers = req.headers as any;
  const { senderId: senderUserId } = req.params as any;

  try 
  {
    const receiverId = await getProfileId(Number(headers['x-user-id']));
    const senderId = await getProfileId(Number(senderUserId));

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId, status: ACCEPTED },
          { senderId: receiverId, receiverId: senderId, status: ACCEPTED },
        ],
      },
    });

    if (!friendship) throw new Error('You are not friends with this user');

    await prisma.friendship.delete({ where: { id: friendship.id } });

  } 
  catch (error) 
  {
    respond.success = false;
    respond.message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).send(respond);
  }

  return res.send(respond);
}


// ----------------- CANCEL FRIEND REQUEST -----------------
export async function cancelFriendRequestHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: 'Friend request canceled' };
  const headers = req.headers as any;
  const { receiverId: receiverUserId } = req.body as any;

  try 
  {
    const senderId = await getProfileId(Number(headers['x-user-id']));
    const receiverId = await getProfileId(Number(receiverUserId));

    const friendship = await prisma.friendship.findFirst({
      where: { senderId, receiverId, status: PENDING },
    });

    if (!friendship) throw new Error('No pending friend request found to cancel');

    await prisma.friendship.delete({ where: { id: friendship.id } });

  } 
  catch (error) 
  {
    respond.success = false;
    respond.message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).send(respond);
  }

  return res.send(respond);
}



export async function searchFriendsByUsernameHandler(req: FastifyRequest, res: FastifyReply) 
{
  const headers = req.headers as any;
  const userId = headers['x-user-id'] as string;
  const respond: ApiResponse<any> = { success: true, message: 'Friends search results fetched' };

  try 
  {
    const query = req.query as any;
    const search = query.q as string;

    if (!search)
      throw new Error("Search query is required")

    const friends = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: true,
        receiver: true
      }
    });


    const filtered = friends.map((f:any) => {
      return f.senderId === userId ? f.receiver : f.sender;
    }).filter((u:any) => 
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.firstName.toLowerCase().includes(search.toLowerCase())
    );

    respond.data = filtered.slice(0, 20);
  
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) respond.message = error.message;
    return res.status(400).send(respond);
  }

  return res.send(respond);
}




// ----------------- VERIFY FRIENDSHIP -----------------
export async function verifyFriendshipHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<{ areFriends: boolean }> = { success: true, message: 'Friendship verified', data: { areFriends: false },};

  try 
  {
    const headers = req.headers as any;
    const userId = headers['x-user-id'];
    const { friendId: friendIdRaw } = req.query as any;



    if (!friendIdRaw)
      throw new Error('Missing friendId query parameter');

    const currentUserId = await getProfileId(Number(userId));
    const friendId = await getProfileId(Number(friendIdRaw));

    if (!currentUserId || !friendId)
      throw new Error('User(s) not found');

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: friendId, status: ACCEPTED },
          { senderId: friendId, receiverId: currentUserId, status: ACCEPTED },
        ],
      },
    });

    respond.data.areFriends = Boolean(friendship);
  } 
  catch (error) 
  {
    respond.success = false;
    respond.message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).send(respond);
  }

  return res.send(respond);
}
