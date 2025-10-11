import fs from 'fs';
import { pipeline } from 'stream/promises';
import { FastifyRequest } from 'fastify';
import prisma from '../db/database';

import { redis } from './redis';

import { ProfileMessages } from './responseMessages';




export async function convertParsedMultipartToJson(req: FastifyRequest): Promise<any> 
{
  const rawBody = req.body as any;
  const data: Record<string, any> = {};
  let filePath: string | undefined;

  for (const key in rawBody) 
  {
    const field = rawBody[key];

    if (field?.type === 'file') 
    {
      filePath = `/tmp/images/${Date.now()}-${field.filename}`;
      await pipeline(field.file, fs.createWriteStream(filePath));
                  data[key] = `${process.env.BACKEND_URL}${filePath}`;
    } 
    else if (field?.type === 'field') 
      data[key] = field.value;
  }

  return { ...data };
}






export async function updateProfileRedis(body: any, userId: number) 
{
  const redisKey = `profile:${userId}`;

  const profile = await redis.get(redisKey);
  if (!profile) throw new Error(ProfileMessages.UPDATE_NOT_FOUND);


  // Merge JSON array fields directly in Redis
  const jsonArrayFields: (keyof typeof profile)[] = ["playerCharacters", "playerPaddles"];
  for (const field of jsonArrayFields) 
  {
    if (body[field]) 
    {
      const newArray = Array.isArray(body[field]) ? body[field] : [body[field]];
      await redis.arrayUniqueMerge(redisKey, field as string, newArray);
    }
  }

  // if (body.preferences)
  //   await redis.mergeObject(redisKey, "preferences", body.preferences);

  // for (const [key, value] of Object.entries(body)) 
  // {
  //   if (!jsonArrayFields.includes(key as keyof typeof profile) && key !== "preferences")
  //     await redis.update(redisKey, key, value);
  // }

  return await redis.get(redisKey);
}









export async function syncRedisProfileToDbAppendArrays(userId: number) 
{
  const redisKey = `profile:${userId}`;

  const redisProfile = await redis.get(redisKey);
  if (!redisProfile) throw new Error(ProfileMessages.UPDATE_NOT_FOUND);

  const dbProfile = await prisma.profile.findUnique({ where: { userId } });

  console.log('DB Profile:', dbProfile?.status);

  const dbPlayerCharacters = Array.isArray(dbProfile?.playerCharacters) 
    ? dbProfile.playerCharacters 
    : (dbProfile?.playerCharacters ? JSON.parse(dbProfile.playerCharacters as string) : []);
  
  const dbPlayerPaddles = Array.isArray(dbProfile?.playerPaddles)
    ? dbProfile.playerPaddles
    : (dbProfile?.playerPaddles ? JSON.parse(dbProfile.playerPaddles as string) : []);

  const mergedPlayerCharacters = [...new Set([
    ...dbPlayerCharacters,
    ...(redisProfile?.playerCharacters ?? []),
  ])];

  const mergedPlayerPaddles = [...new Set([
    ...dbPlayerPaddles,
    ...(redisProfile?.playerPaddles ?? []),
  ])];



  const { id, createdAt, updatedAt, preferences, ...cleanRedisProfile } = redisProfile;

  const profile = await prisma.profile.update({
    where: { userId },
    data: {
      ...cleanRedisProfile,
      // Update preferences as a nested update
      preferences: {
        update: {
          soundEnabled: preferences?.soundEnabled,
          musicEnabled: preferences?.musicEnabled,
          twoFactorEnabled: preferences?.twoFactorEnabled,
        }
      }
    }
  });

  console.log('Updated DB Profile:', profile);
  
  await redis.del(redisKey);
  return profile;
}

export async function getProfile(userId: number)
{

  const profile = await prisma.profile.findUnique({ where: { userId }});
  if (!profile) throw new Error(`Profile not found for userId ${userId}`);
  return profile;
}


export function checkSecretToken(req: FastifyRequest)
{
  const secretToken = req.headers['x-secret-token'] as string;
  if (secretToken !== process.env.SECRET_TOKEN)
    throw new Error('Unauthorized: Invalid secret token');
}



export async function isCheck(userId: number, friendId: number)
{
  if(userId === friendId)
    throw new Error('You cannot perform this action on yourself.');

  const profile = await getProfile(friendId);

  return profile;
}




export async function updateUserInServices(serviceUrl: string,method : string ,   body : any )
{
  await fetch(serviceUrl, {
    method: method,
    headers: { 'Content-Type': 'application/json' , 'X-Secret-Token': process.env.SECRET_TOKEN || '' },
    body: JSON.stringify(body),
  });
}

export async function isReadyExists(username: string | undefined ) : Promise<boolean>
{
  if (!username) return false;
  const existingProfile = await prisma.profile.findUnique({ where: { username } });
  return (!!existingProfile);
}

export async function sendServiceRequest({ url , method = 'GET', body, headers = {}}: {
  url: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}) 
{
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body !== undefined) 
  {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) 
    {
    return await response.json();
  } 
  else {
    return await response.text();
  }
  
}









export function getPromotedRank(profileRedis: any, newLevel: number) 
{
  const rankDivisions = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER'];
  let newRankTier = profileRedis.rankTier;
  let newRankDivision = profileRedis.rankDivision;

  // Promotion logic: if level >= 100, promote tier
  if (newLevel >= 100) 
  {
    switch (profileRedis.rankTier) {
      case 'I':
        newRankTier = 'II';
        break;
      case 'II':
        newRankTier = 'III';
        break;
      case 'III':
        const currentDivisionIndex = rankDivisions.indexOf(profileRedis.rankDivision);
        if (currentDivisionIndex < rankDivisions.length - 1) {
          newRankDivision = rankDivisions[currentDivisionIndex + 1];
          newRankTier = 'I';
        }
        break;
      default:
        break;
    }
    newLevel = newLevel % 100;
  }
  return { newRankTier, newRankDivision , newLevel };
}





export async function mergeProfileWithRedis(profile: any): Promise<any> 
{
  const cacheKey = `profile:${profile.userId}`;
  if (await redis.exists(cacheKey)) 
  {
    const redisProfile = await redis.get(cacheKey);
    return { ...profile, ...redisProfile };
  }
  return profile;
}
