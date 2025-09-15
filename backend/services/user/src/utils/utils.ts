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
      data[key] = `${process.env.URL}${filePath}`;
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

  if (body.preferences)
    await redis.mergeObject(redisKey, "preferences", body.preferences);

  for (const [key, value] of Object.entries(body)) 
  {
    if (!jsonArrayFields.includes(key as keyof typeof profile) && key !== "preferences")
      await redis.update(redisKey, key, value);
  }

  return await redis.get(redisKey);
}


export async function syncRedisProfileToDbAppendArrays(userId: number) 
{
  const redisKey = `profile:${userId}`;

  const redisProfile = await redis.get(redisKey);
  if (!redisProfile) throw new Error(ProfileMessages.UPDATE_NOT_FOUND);

  const dbProfile = await prisma.profile.findUnique({ where: { userId } });

  const playerCharacters = [...new Set((dbProfile?.playerCharacters as unknown[] ?? []).concat(redisProfile?.playerCharacters as unknown[] ?? []))];
  const playerPaddles = [...new Set((dbProfile?.playerPaddles as unknown[] ?? []).concat(  redisProfile?.playerPaddles as unknown[] ?? []))];

  await prisma.profile.update({
    where: { userId },
    data: {
      ...redisProfile,
      playerCharacters,
      playerPaddles,
      preferences: { ...redisProfile.preferences },
    },
  });

  return redisProfile;
}




export async function getProfile(userId: number)
{

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });
  if (!profile) throw new Error(`Profile not found for userId ${userId}`);
}
