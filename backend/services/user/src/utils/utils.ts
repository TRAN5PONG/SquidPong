
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { FastifyRequest } from 'fastify';
import prisma from '../db/database';
import { redis } from '../integration/redis.integration';
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
    headers: { 'Content-Type': 'application/json' , 'x-secret-token': process.env.SECRET_TOKEN || '' },
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

// Service configuration
const SERVICE_URLS = {
  auth: 'http://auth:4001/api/auth',
  chat: 'http://chat:4003/api/chat',
  notify: 'http://notify:4004/api/notify'
} as const;

const ENDPOINTS = {
  POST: '/user/create',
  PUT: '/user/update',
  DELETE : '/user/update'
}
// HTTP methods that don't support body
const NO_BODY_METHODS = ['GET', 'DELETE'];

export async function sendServiceRequestSimple(serviceName : string , userId : number, method : string = 'GET', body?: any ) 
{
  const url = SERVICE_URLS[serviceName as keyof typeof SERVICE_URLS] + (ENDPOINTS as any)[method.toUpperCase()];
  
  const headers: Record<string, string> = {
    'x-secret-token': process.env.SECRET_TOKEN || '',
    'x-user-id': String(userId),
  };
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (!NO_BODY_METHODS.includes(method.toUpperCase()) && body !== undefined) 
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  const response = await fetch(url, options);
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




export async function purchaseItem(user : any, itemType: 'playerCharacters' | 'playerPaddles', itemName: string) : Promise<any>
{
  const { getCharacterPrice, getPaddlePrice } = await import('../utils/itemPrices');
  const new_data : any = {};
  let itemPrice : number = 0;
  new_data['playerCharacters'] = user.playerCharacters;
  new_data['playerPaddles'] = user.playerPaddles;
  
  if(itemName === undefined) return;
  if (itemType === 'playerCharacters')
  {
    if(user.playerCharacters.includes(itemName))
      return new_data[itemType];
    itemPrice = getCharacterPrice(itemName);
  } 
  else if (itemType === 'playerPaddles')
  {
    if(user.playerPaddles.includes(itemName))
      return new_data[itemType];
    itemPrice = getPaddlePrice(itemName);
  } 

  let existsInRedis = false;
  const userId = user.userId; 
  const userKey = `user:${userId}`;
  let walletBalance : number = 0; 
  if (await redis.exists(userKey)) 
  {
    existsInRedis = true;
    walletBalance = (await redis.get(userKey))?.walletBalance;
  } 
  else 
    walletBalance = user.walletBalance; 
  if (walletBalance < itemPrice)
    throw new Error(`Insufficient wallet balance. Required: ${itemPrice}, Available: ${walletBalance}`);  
  const newWalletBalance = walletBalance - itemPrice;
  if(existsInRedis)
    await redis.update( userKey , '$' , {walletBalance : newWalletBalance} );
  else
  {

    user.walletBalance = newWalletBalance;
    // new_data['walletBalance'] = newWalletBalance;
  }

  new_data[itemType].push(itemName);
  return new_data[itemType];
}








/**
 * Buy verified status for a user for 500 coins.
 * Deducts coins and sets isVerified=true if enough balance.
 * Throws error if insufficient balance or already verified.
 */
export async function buyVerified(user: any)
{
  const userKey = `profile:${user.userId}`;
  
  if(user.isVerified) return true;
  if(user.walletBalance < 500)  return false;
  
  user.walletBalance -= 500;

  if (await redis.exists(userKey)) 
    await redis.update(userKey, '$', { isVerified: true });
}

