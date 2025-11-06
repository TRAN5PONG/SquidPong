import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse, sendError } from '../utils/errorHandler';
import { Profile } from '../utils/types';
import { redis } from '../integration/redis.integration';
import { ProfileMessages, GeneralMessages } from '../utils/responseMessages';
import { checkSecretToken } from '../utils/utils';
import { sendServiceRequest , getPromotedRank , isReadyExists } from '../utils/utils';
import { mergeProfileWithRedis } from '../utils/utils';
import { convertParsedMultipartToJson } from '../utils/utils';
import { purchaseItem } from '../utils/utils';
import { sendServiceRequestSimple } from '../utils/utils';
import { buyVerified } from '../utils/utils';
import { removeFriendFromChat } from '../integration/chat.restapi';


import { deleteAccountInChat } from '../integration/chat.restapi';
import { deleteAccountInNotify } from '../integration/notify.restapi';





export async function createProfileHandler(req: FastifyRequest, res: FastifyReply) 
{
  const response: ApiResponse<null> = {  success: true,  message: ProfileMessages.CREATE_SUCCESS  };
  const body = req.body as {userId : number ,  username: string; firstName: string; lastName: string; avatar?: string };

  body['avatar'] = body['avatar'] || `/default/avatar.png`;
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
  const respond: ApiResponse<any> = { success: true, message: ProfileMessages.UPDATE_SUCCESS };
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);

  let body = req.body as any;
  try
  {
    let existingProfile = await prisma.profile.findUnique({ where: { userId } });
    if (!existingProfile) throw new Error(ProfileMessages.UPDATE_NOT_FOUND);

    if(body.username == existingProfile.username) throw new Error(ProfileMessages.SAME_USERNAME);
    if(await isReadyExists(body.username)) throw new Error(ProfileMessages.READY_EXISTS);

    body.playerCharacters = await purchaseItem(existingProfile ,'playerCharacters' ,  body.playerCharacters);
    body.playerPaddles = await purchaseItem(existingProfile ,'playerPaddles' ,  body.playerPaddles);
    body['walletBalance'] = existingProfile.walletBalance;
    if(body.isVerified === true)
      body['isVerified'] = buyVerified(existingProfile);
  
  const updatedProfile = await prisma.profile.update({
          where: { userId },
          data: {
            ...body,
            ...(body.preferences && {
              preferences: {
                update: {
                  ...body.preferences,
                  ...(body.preferences.notifications && {
                    notifications: {
                      update: { ...body.preferences.notifications }
                    }
                  })
                }
              }
            })
          }
        });

    if(body.username)
      await sendServiceRequestSimple('chat', userId, 'PUT',{username : body.username } )

    const dataSend = {
      ...(body.username && { username : body.username }),
      ...(body.firstName && { firstName : body.firstName }),
      ...(body.lastName && { lastName : body.lastName }),
      ...(body.isVerified && { isVerified : body.isVerified }),
    }


    await sendServiceRequestSimple('chat', userId, 'PUT', dataSend )
    await sendServiceRequestSimple('notify', userId, 'PUT', {...dataSend , notificationSettings : 
    {...(body.preferences.notifications && { ...body.preferences.notifications })}
    } )
   
    const redisKey = `profile:${userId}`;
    if(await redis.exists(redisKey))
      await redis.update(redisKey, '$', dataSend); 
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
  const { username } = req.params as { username: string };

  try 
  {
    const profile = await prisma.profile.findUnique({ where: { username } });
    if (!profile) throw new Error(GeneralMessages.NOT_FOUND);
    respond.data = await mergeProfileWithRedis(profile);
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
    const updated = await prisma.profile.update({ where: { userId }, data: { avatar: parsed } });

    const redisKey = `profile:${userId}`;
    if (await redis.exists(redisKey)) 
      await redis.update(redisKey, '$', { avatar: parsed });

    respond.data = updated;
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


export async function getShopItemsHandler(req: FastifyRequest, res: FastifyReply) 
{
  const response: ApiResponse<any> = { success: true, message: 'Shop items retrieved successfully' };
  const userId = parseInt(req.headers['x-user-id'] as string);

  try {
    const { ITEM_PRICES } = await import('../utils/itemPrices');
    
    const userKey = `user:${userId}`;
    let userProfile: any = null;
    let existingCharacters: string[] = [];
    let existingPaddles: string[] = [];

    // Check Redis first, then database
    if (await redis.exists(userKey)) {
      userProfile = await redis.get(userKey);
      existingCharacters = Array.isArray(userProfile?.playerCharacters) 
        ? userProfile.playerCharacters 
        : JSON.parse(userProfile?.playerCharacters || '["Zero"]');
      existingPaddles = Array.isArray(userProfile?.playerPaddles) 
        ? userProfile.playerPaddles 
        : JSON.parse(userProfile?.playerPaddles || '["Boss"]');
    } else {
      userProfile = await prisma.profile.findUnique({
        where: { userId },
        select: {
          playerCharacters: true,
          playerPaddles: true,
          walletBalance: true
        }
      });

      if (!userProfile) {
        throw new Error('User not found');
      }

      existingCharacters = JSON.parse(userProfile.playerCharacters || '["Zero"]');
      existingPaddles = JSON.parse(userProfile.playerPaddles || '["Boss"]');
    }

    // Build shop data
    const availableCharacters = Object.entries(ITEM_PRICES.characters).map(([name, price]) => ({
      name,
      price,
      type: 'character',
      owned: existingCharacters.includes(name),
      canPurchase: !existingCharacters.includes(name) && (userProfile?.walletBalance || 0) >= price
    }));

    const availablePaddles = Object.entries(ITEM_PRICES.paddles).map(([name, price]) => ({
      name,
      price,
      type: 'paddle',
      owned: existingPaddles.includes(name),
      canPurchase: !existingPaddles.includes(name) && (userProfile?.walletBalance || 0) >= price
    }));

    response.data = {
      walletBalance: userProfile?.walletBalance || 0,
      characters: availableCharacters,
      paddles: availablePaddles,
      ownedCharacters: existingCharacters,
      ownedPaddles: existingPaddles
    };

  } catch (error) {
    return sendError(res, error);
  }

  return res.send(response);
}


export async function sendNotificationHandler(req: FastifyRequest, res: FastifyReply) 
{
  const response: ApiResponse<any> = { success: true, message: 'Notification sent successfully' };
  const headers = req.headers as any;
  const senderId = Number(headers['x-user-id']);

  try {
    const body = req.body as any;
    const { userId, message, type } = body;

    if (!userId || !message) {
      throw new Error('userId and message are required');
    }

    const { createNotificationInNotify } = await import('../integration/notify.restapi');
    
    const notification = await createNotificationInNotify(Number(userId), message, type || 'INFO');
    response.data = notification;

    console.log(`User ${senderId} sent notification to user ${userId}: ${message}`);
  } catch (error) {
    return sendError(res, error);
  }

  return res.send(response);
}
