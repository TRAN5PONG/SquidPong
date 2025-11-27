import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { Profile } from '../utils/types';
import { redis } from '../integration/redis.integration';
import { ProfileMessages, GeneralMessages } from '../utils/responseMessages';
import { checkSecretToken } from '../utils/utils';
import { sendServiceRequest , getPromotedRank , isReadyExists } from '../utils/utils';
import { purchaseItem , buyVerified, mergeProfileWithRedis , sendServiceRequestSimple,SelectedItemExists , convertParsedMultipartToJson } from '../utils/utils';
import { removeFriendFromChat } from '../integration/chat.restapi';

import { deleteAccountInChat } from '../integration/chat.restapi';
import { deleteAccountInNotify } from '../integration/notify.restapi';




export async function createProfileHandler(req: FastifyRequest, res: FastifyReply) 
{
  const response: ApiResponse<null> = {  success: true,  message: ProfileMessages.CREATE_SUCCESS  };
  const body = req.body as {userId : number ,  username: string; firstName: string; lastName: string; avatar?: string };

  body['avatar'] = body['avatar'] || `${process.env.BACKEND_URL || 'http://localhost:4000'}:4433/api/user/avatars/default.png`;
  try 
  {
    checkSecretToken(req);
    await prisma.profile.create({
      data: {
        ...body,
        preferences: { create: { notifications: { create: {} } } },
      },
    });
    
    await sendServiceRequestSimple('chat', body.userId, 'POST',  {...body , userId : String(body.userId) } )
    await sendServiceRequestSimple('notify', body.userId, 'POST',{...body , userId : String(body.userId) } )
  } 
  catch (error) {
    return sendError(res, error);
  }

  return res.send(response);
}

export async function updateProfileHandlerDB(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: ProfileMessages.UPDATE_SUCCESS };
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);

  let newData: { isVerified?: boolean , walletBalance?: number } = {};
  let body = req.body as any;

  try
  {

    let existingProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!existingProfile) throw new Error(ProfileMessages.UPDATE_NOT_FOUND);

    if(await isReadyExists(body.username , existingProfile.username)) throw new Error(ProfileMessages.READY_EXISTS);

    body.playerCharacters = await purchaseItem(existingProfile ,'playerCharacters' ,  body.playerCharacters);
    body.playerPaddles = await purchaseItem(existingProfile ,'playerPaddles' ,  body.playerPaddles);

    newData.walletBalance = existingProfile.walletBalance;

    if(body.isVerified === true)
      newData = await buyVerified(existingProfile);

    body = { ...body , ...newData };

    if(body.playerSelectedCharacter)
    {
      const exists = await SelectedItemExists( existingProfile , 'playerCharacters' , body.playerSelectedCharacter);
      if(!exists) throw new Error(ProfileMessages.PLAYER_IS_NOT_OWNED);
    }
    if(body.playerSelectedPaddle)
    {
      const exists = await SelectedItemExists( existingProfile , 'playerPaddles' , body.playerSelectedPaddle);
      if(!exists) throw new Error(ProfileMessages.PADDLE_IS_NOT_OWNED);
    }


    const updatedProfile = await prisma.profile.update({
          where: { userId },
          data: {
            ...body,
            ...(body.preferences && {
              preferences: {
                update: {
                  ...body.preferences,
                  ...(body.preferences.notifications && {
                    notifications: { update: { ...body.preferences.notifications }}
                  })
                }
              }
            })
          }
        });

    if(body.username)
      await sendServiceRequestSimple('auth', userId, 'PUT',{username : body.username } )

    if(body.customStatus)
    {
      await redis.update(`profile:${userId}`, '$', { customStatus: body.customStatus });

    }

    const dataSend = {
      ...(body.username && { username : body.username }),
      ...(body.firstName && { firstName : body.firstName }),
      ...(body.lastName && { lastName : body.lastName }),
      ...(body.isVerified && { isVerified : body.isVerified }),
      ...(body.customStatus && { customStatus : body.customStatus }),
    }


    await sendServiceRequestSimple('chat', userId, 'PUT', dataSend )
    await sendServiceRequestSimple('notify', userId, 'PUT', {...dataSend , notificationSettings : 
    {...(body.preferences?.notifications && { ...body.preferences.notifications })}
    } )
   

    const redisKey = `profile:${userId}`;
    if(await redis.exists(redisKey)) {
      await redis.update(redisKey, '$', dataSend);
    }
  
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
  const cacheKey = `profile:${userId}`; 

  const body = req.body as { 
    score?: number; 
    level?: number; 
    status?: 'ONLINE' | 'OFFLINE';
    updateLastSeen?: boolean 
  };
  let profile;
  
  try 
  {
    if (Token !== process.env.SECRET_TOKEN) throw new Error(GeneralMessages.UNAUTHORIZED);
    
    if (body.status !== undefined) 
    {
      let dataToUpdate: any = {status : body.status };
      const redisProfile = await redis.get(cacheKey);
      if(body.status === 'OFFLINE')
      {
        dataToUpdate.lastSeen = new Date();
        dataToUpdate = { ...dataToUpdate , ...redisProfile  };
      }

      await prisma.profile.update({
        where: { userId },
        data: dataToUpdate
      });

      await sendServiceRequestSimple('chat', userId, 'PUT', {status : body.status} )
      await sendServiceRequestSimple('notify', userId, 'PUT', {status : body.status} )
      if(await redis.exists(cacheKey))
        await redis.update(cacheKey, '$', { status: body.status , ...(body.status === 'OFFLINE' && { lastSeen : new Date() }) });

      return res.send(respond);
    }

    // Handle score/level updates
    if (!(await redis.exists(cacheKey)))
    {
      profile = await prisma.profile.findUnique({ where: { userId } });
      if(!profile) throw new Error(ProfileMessages.FETCH_NOT_FOUND);
      
      await redis.set(cacheKey, {
        status: profile.status,
        avatar: profile.avatar, 
        username: profile.username, 
        firstName: profile.firstName, 
        lastName: profile.lastName,
      });
    }
    else {
      profile = await redis.get(cacheKey);
    }
    
    const new_score = profile.score + (body.score || 0);
    const { newRankTier, newRankDivision, newScore } = getPromotedRank(profile, new_score);

    const newLevel = (Math.sign(body.score || 0) === 1) 
      ? (profile.level + ((body.score || 0) / 10)) 
      : profile.level + (body.level || 0);
    
    await redis.update(cacheKey, '$', {
      score: newScore,
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
    checkSecretToken(req);
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new Error(ProfileMessages.DELETE_NOT_FOUND);
    
    const deletedUsername = `deleted_user_${userId}`;
    await prisma.profile.update({ where: { userId }, data: { isDeleted: true , username : deletedUsername } });
    await redis.del(cacheKey);

    // Notify other services about account deletion
    await deleteAccountInChat(userId);
    await deleteAccountInNotify(userId);
    
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
      include: { preferences: { include: { notifications: true } } },
    });
    if (!profile) throw new Error(ProfileMessages.FETCH_NOT_FOUND);
    
    respond.data = await mergeProfileWithRedis(profile);

    if(!(await redis.exists(`profile:${userId}`)))
    {
      await redis.set(`profile:${userId}`,{
        status : profile.status , customStatus : profile.customStatus , 
      username : profile.username , firstName : profile.firstName , lastName : profile.lastName ,  
      avatar : profile.avatar, score : profile.score , level : profile.level
      });
    }
    
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
      where: { userId: Number(id)  , isDeleted : false },
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
  
  const headers = req.headers as {'x-user-id': string};
  const userId = Number(headers['x-user-id']);

  const { username } = req.params as { username: string };

  try 
  {
    let profile = await prisma.profile.findUnique({ where: { username } });
    if (!profile) throw new Error(GeneralMessages.NOT_FOUND);

    let profileWithStatus: any = await mergeProfileWithRedis(profile);

    if(userId !== profile.userId)
    {
      const statusFriends = await prisma.friendship.findFirst({
        where: {
          OR: [
            { senderId : userId, receiverId: profile.userId },
            { senderId : profile.userId, receiverId: userId }
          ]
        }
      });
      if(!statusFriends)
        profileWithStatus.relationshipStatus = 'NO_RELATIONSHIP';
      else
      {
        if(statusFriends.status === 'ACCEPTED')
          profileWithStatus.relationshipStatus = 'FRIENDS';
        else if(statusFriends.status === 'PENDING')
        {
          if(statusFriends.senderId === userId)
            profileWithStatus.relationshipStatus = 'REQUEST_SENT';
          else
            profileWithStatus.relationshipStatus = 'REQUEST_RECEIVED';
        }
        else if(statusFriends.status === 'BLOCKED')
        {
          const isblocker = await prisma.blockedUser.findFirst({
            where: {
              blockerId : userId,
              blockedId : profile.userId
            }
          });
          if(isblocker) profileWithStatus.relationshipStatus = 'YOU_BLOCKED';
          else profileWithStatus.relationshipStatus = 'BLOCKED_YOU';
        }
      }
      
    }
    
    respond.data = profileWithStatus;
  } 
  catch (error) {
    return sendError(res, error);
  }
  return res.send(respond);
}


export async function updateProfileImageHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: ProfileMessages.UPDATE_SUCCESS };
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);

  try 
  {
    const parsed = await convertParsedMultipartToJson(req) as any;
    await prisma.profile.update({ where: { userId }, data: { avatar: parsed } });

    const redisKey = `profile:${userId}`;
    if (await redis.exists(redisKey)) 
      await redis.update(redisKey, '$', { avatar: parsed });

    await sendServiceRequestSimple('chat', userId, 'PUT', { avatar: parsed } )
    await sendServiceRequestSimple('notify', userId, 'PUT', { avatar: parsed } )


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
        isDeleted : false,
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
