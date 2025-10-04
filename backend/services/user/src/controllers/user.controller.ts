import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { updateProfileRedis , convertParsedMultipartToJson , syncRedisProfileToDbAppendArrays } from '../utils/utils';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { Profile } from '../utils/types';
import { redis } from '../utils/redis';
import { ProfileMessages, PreferenceMessages, NotificationMessages, GeneralMessages } from '../utils/responseMessages';
import { checkSecretToken } from '../utils/utils';




export async function createProfileHandler(req: FastifyRequest, res: FastifyReply) 
{
  const response: ApiResponse<null> = {  success: true,  message: ProfileMessages.CREATE_SUCCESS  };
  const {userId , username , firstName , lastName , avatar} = req.body as {userId : number , username : string , firstName : string , lastName : string , avatar? : string};
  
  const newProfileData: any = { userId , username, firstName, lastName, avatar};

  try 
  {
    checkSecretToken(req);
    const profile = await prisma.profile.create({
      data: {
        ...newProfileData,
        preferences: { create: { notifications: { create: {} } } },
      },
    });

    // Ensure user exists in chat service
    await fetch('http://chat:4003/api/chat/user/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' , 'X-Secret-Token': process.env.SECRET_TOKEN || '' },
      body: JSON.stringify({ ...newProfileData, isVerified: false  , avatar : profile.avatar }),
    });


  } 
  catch (error) {
    return sendError(res, error);
  }

  return res.send(response);
}


export async function updateProfileHandlerDB(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: ProfileMessages.UPDATE_SUCCESS };
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  
  const {status} = req.body as {status : string};

  try 
  {

  checkSecretToken(req);
  if(status == "ONLINE")
    await prisma.profile.update({ where: { userId }, data: { status : "ONLINE" } });
  else
  {
    const profile = await syncRedisProfileToDbAppendArrays(userId);

    // Ensure user is updated in chat service
    const chatUser = await fetch('http://chat:4003/api/chat/user/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' , 'X-Secret-Token': process.env.SECRET_TOKEN || '' },
      body: JSON.stringify({ userId : String(userId) , username : profile.username , firstName : profile.firstName , lastName : profile.lastName , avatar : profile.avatar , isVerified : false }),
    });
    
  }
  }
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}



export async function updateProfileHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<Profile> = { success: true, message: ProfileMessages.UPDATE_SUCCESS };
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  
  try 
  {
    const body = await convertParsedMultipartToJson(req);

    console.log("Body Update : ", body);
    respond.data = await updateProfileRedis(body , userId);

  }
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}




export async function getAllUserHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<Profile[]> = {success: true,  message: ProfileMessages.FETCH_SUCCESS};

  try 
  {
    const onlineUserIds: string[] = await redis.getOnlineUsers();

    const offlineProfiles = await prisma.profile.findMany({
      where: { status: "OFFLINE" },
      include: { preferences: { include: { notifications: true } } },
    });

    const onlineProfiles: Profile[] = [];
    for (const userId of onlineUserIds) 
    {
      const profile = await redis.get(`profile:${userId}`);
      if (profile)
        onlineProfiles.push({ ...profile, status: "ONLINE" });
    }

    const allProfiles = [
      ...offlineProfiles,
      ...onlineProfiles,
    ];

    respond.data = allProfiles;

  } 
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}


export async function deleteProfileHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: ProfileMessages.DELETE_SUCCESS };
  
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);

  const cacheKey = `profile:${userId}`;

  try 
  {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new Error(ProfileMessages.DELETE_NOT_FOUND);

    await prisma.profile.delete({ where: { userId } });

    await redis.del(cacheKey);

    // Ensure user is deleted in chat service
    await fetch('http://chat:4003/api/chat/user/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' , 'X-Secret-Token': process.env.SECRET_TOKEN || '' },
      body: JSON.stringify({ userId : String(userId) }),
    });

  }
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}




export async function getCurrentUserHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: ProfileMessages.FETCH_SUCCESS };

  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  const cacheKey = `profile:${userId}`;

  try 
  {
    let profile = await redis.get(cacheKey);

    if (!profile) 
    {
      profile = await prisma.profile.findUnique({
        where: { userId },
        include: { preferences: true },
      });

      if (!profile) throw new Error(ProfileMessages.FETCH_NOT_FOUND);
      await redis.set(cacheKey, profile);
    }

    respond.data = profile;
  } 
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}



export async function getUserByIdHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: ProfileMessages.FETCH_SUCCESS };
  
  const { id } =  req.params as { id: string };
  const cacheKey = `profile:${id}`;

  try 
  {
    let profile = await redis.get(cacheKey);

    if (!profile) 
    {
      profile = await prisma.profile.findUnique({
        where: { userId : Number(id)  },
        include: { preferences: true },
      });

      if (!profile) throw new Error(ProfileMessages.FETCH_NOT_FOUND);
    }

    respond.data = profile;
  }
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}



export async function searchUsersHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<Profile[]> = { success: true, message: ProfileMessages.FETCH_SUCCESS };
  const { query } = req.query as { query: string };

  if (!query)
  {
    respond.success = false;
    respond.message =  'Query parameter is required';
    return res.status(400).send(respond);
  }

  try 
  {

    const onlineUserIds: string[] = await redis.getOnlineUsers();
    const onlineProfiles: Profile[] = [];

    // Fetch online users from Redis cache
    for (const userId of onlineUserIds) 
    {
      const profile = await redis.get(`profile:${userId}`);
      if (profile) 
      {
        if (
          profile.username.toLowerCase().includes(query.toLowerCase()) ||
          profile.firstName.toLowerCase().includes(query.toLowerCase())
        ) 
        {
          onlineProfiles.push({ ...profile});
        }
      }
    }


    const offlineProfiles = await prisma.profile.findMany({
      where: {
        OR: [
          { username: { contains: query,} },
          { firstName: { contains: query,} },
        ],
        id: { notIn: onlineUserIds },
      },
      include: { preferences: { include: { notifications: true } } },
    });

    const allProfiles = [...onlineProfiles, ...offlineProfiles];

    respond.data = allProfiles;
  } 
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}
