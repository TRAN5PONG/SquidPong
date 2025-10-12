import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { updateProfileRedis , convertParsedMultipartToJson , syncRedisProfileToDbAppendArrays } from '../utils/utils';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { Profile } from '../utils/types';
import { redis } from '../utils/redis';
import { ProfileMessages, PreferenceMessages, NotificationMessages, GeneralMessages } from '../utils/responseMessages';
import { checkSecretToken } from '../utils/utils';
import { updateUserInServices } from '../utils/utils';
import { sendServiceRequest , getPromotedRank , isReadyExists } from '../utils/utils';
import { mergeProfileWithRedis } from '../utils/utils';



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
  
  const { username, firstName, lastName, banner, bio } = req.body as {
    username?: string;
    firstName?: string;
    lastName?: string;
    banner?: string;
    bio?: string;
  };

  try
  {
    const existingProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!existingProfile) throw new Error(ProfileMessages.UPDATE_NOT_FOUND);
    
    if(username == existingProfile.username) throw new Error(ProfileMessages.SAME_USERNAME);
    if(await isReadyExists(username)) throw new Error(ProfileMessages.READY_EXISTS);

    const updatedProfile = await prisma.profile.update({ where: { userId },
      data: { username, firstName, lastName, banner,  bio },
    });
    
    if(username)
    {
    await sendServiceRequest({
        url: 'http://auth:4001/api/auth/update',
        method: 'POST',
        body: {username },
        headers: { 'x-secret-token': process.env.SECRET_TOKEN || '' , 'x-user-id': String(userId) },
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
  const Token = headers['x-secret-token'];
  const body = req.body as { level?: number };
  const cacheKey = `profile:${userId}`;

  try 
  {
    if (Token !== process.env.SECRET_TOKEN) throw new Error(GeneralMessages.UNAUTHORIZED);
    const profileRedis = await redis.get(cacheKey);
    
    const new_level = body.level !== undefined ? profileRedis.level + body.level : Number(profileRedis.level);
    const { newRankTier, newRankDivision , newLevel } = getPromotedRank(profileRedis, new_level);
    
    await redis.update(cacheKey, '$', {
      level: newLevel,
      rankTier: newRankTier,
      rankDivision: newRankDivision
    });
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
    const profiles = await prisma.profile.findMany({ include: { preferences: true } });
    const mergedProfiles = await Promise.all(profiles.map(mergeProfileWithRedis));
    respond.data = mergedProfiles;
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

  try 
  {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { preferences: true },
    });
    if (!profile) throw new Error(ProfileMessages.FETCH_NOT_FOUND);
    respond.data = await mergeProfileWithRedis(profile);
  }
  catch (error) {
    return sendError(res, error);
  }
  return res.send(respond);
}

export async function getUserByIdHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: ProfileMessages.FETCH_SUCCESS };
  const { id } = req.params as { id: string };

  try 
  {
    const profile = await prisma.profile.findUnique({
      where: { userId: Number(id) },
      include: { preferences: true },
    });
    if (!profile) throw new Error(ProfileMessages.FETCH_NOT_FOUND);
    respond.data = await mergeProfileWithRedis(profile);
  } 
  catch (error) {
    return sendError(res, error);
  }
  return res.send(respond);
}


export async function getUserByUserNameHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: ProfileMessages.FETCH_SUCCESS };
  const { Username } = req.params as { Username: string };

  try 
  {
    const profile = await prisma.profile.findUnique({ where: { username: Username } });
    if (!profile) throw new Error(GeneralMessages.NOT_FOUND);
    respond.data = await mergeProfileWithRedis(profile);
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

  try 
  {
    if(!query) throw new Error('Query parameter is required');

    const dbProfiles = await prisma.profile.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { firstName: { contains: query } }
        ]
      },
      include: { preferences: { include: { notifications: true } } }
    });
    const mergedProfiles = await Promise.all(dbProfiles.map(mergeProfileWithRedis));
    respond.data = mergedProfiles;
  } 
  catch (error) {
    return sendError(res, error);
  }
  return res.send(respond);
}
