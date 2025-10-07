import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { updateProfileRedis , convertParsedMultipartToJson , syncRedisProfileToDbAppendArrays } from '../utils/utils';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { Profile } from '../utils/types';
import { redis } from '../utils/redis';
import { ProfileMessages, PreferenceMessages, NotificationMessages, GeneralMessages } from '../utils/responseMessages';
import { checkSecretToken } from '../utils/utils';
import { updateUserInServices } from '../utils/utils';
import { sendServiceRequest } from '../utils/utils';
import { isReadyExists } from '../utils/utils';

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
  
  const { username, firstName, lastName, banner, bio, isVerified } = req.body as {
    username?: string;
    firstName?: string;
    lastName?: string;
    banner?: string;
    bio?: string;
    isVerified?: boolean;
  };

  try
  {
    const existingProfile = await prisma.profile.findUnique({ where: { userId } });
    
    if (!existingProfile) throw new Error(ProfileMessages.UPDATE_NOT_FOUND);
    if(username == existingProfile.username) throw new Error(ProfileMessages.SAME_USERNAME);
    if(await isReadyExists(username)) throw new Error(ProfileMessages.READY_EXISTS);


    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: { username, firstName, lastName, 
          banner,  bio,  isVerified
        },
    });
    
    if(username)
    {
    await sendServiceRequest({
        url: 'http://auth:4001/api/auth/update',
        method: 'POST',
        body: {username },
        headers: { 'X-Secret-Token': process.env.SECRET_TOKEN || '' , 'x-user-id': String(userId) },
    });
    }

    const redisKey = `profile:${userId}`;
    if(await redis.exists(redisKey))
      await redis.update(redisKey, '$', {level : 3 }); 

    respond.data = { ...updatedProfile };

  }
  catch (error) {
    return sendError(res, error);
  }  

  return res.send(respond);
}



export async function updateProfileHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: ProfileMessages.UPDATE_SUCCESS };
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);

  const {}
}





export async function getAllUserHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<Profile[]> = {success: true,  message: ProfileMessages.FETCH_SUCCESS};

  try 
  {
    const profiles = await prisma.profile.findMany({ include: { preferences: true } });
    respond.data = profiles;

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
    // await updateUserInServices('http://chat:4003/api/chat/user/delete', 'DELETE' , { userId : String(userId) });

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
    const profile = await prisma.profile.findUnique({
        where: { userId },
        include: { preferences: true },
      });
      if (!profile) throw new Error(ProfileMessages.FETCH_NOT_FOUND);

    console.log("Profile DB : " , profile);
    const profileRedis = await redis.get(cacheKey);

    console.log("Profile Redis : " , profileRedis);
      await redis.set(cacheKey, {username : profile.username , firstName : profile.firstName , lastName : profile.lastName , avatar : profile.avatar  ,
        isVerified : profile.isVerified , status : profile.status,
        walletBalance : profile.walletBalance , level : profile.level , rankDivision : profile.rankDivision , rankTier : profile.rankTier
      });

    respond.data = {...profile , ...profileRedis};
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

export async function getUserByUserNameHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: ProfileMessages.FETCH_SUCCESS };
  const { Username } =  req.params as { Username: string };
  
  try 
  {
    let profile  = await prisma.profile.findUnique({ where: { username : Username } });
    if(!profile) throw new Error(GeneralMessages.NOT_FOUND);

    const cacheKey = `profile:${profile.userId}`;
    if(await redis.exists(cacheKey))
      profile = await redis.get(cacheKey);
  
    respond.data = profile;
  }
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}












// 🎯 DB Profile Object
const dbProfileFields = {
  username: true,
  firstName: true,
  lastName: true,
  avatar: true,
  banner: true,
  bio: true,
  isVerified: true,
  rankDivision: true,
  rankTier: true,
  preferences: true,
};






// ⚡ Redis Cache Profile Object
const redisProfileFields = {
  username: true,         // needed for in-game name
  avatar: true,           // show in match
  walletBalance: true,    // coins
  level: true,            // XP/level
  rankDivision: true,
  rankTier: true,
  status: true,           // ONLINE / IN_MATCH
  lastSeen: true,
  playerCharacters: true, // inventory
  playerSelectedCharacter: true,
  playerPaddles: true,
  playerSelectedPaddle: true,
};
