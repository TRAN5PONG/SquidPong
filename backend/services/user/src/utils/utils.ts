
import fs from 'fs';
import { FastifyRequest } from 'fastify';
import prisma from '../db/database';
import { redis } from '../integration/redis.integration';
import { ProfileMessages } from './responseMessages';
import path from 'path';
import crypto from 'crypto';


export async function convertParsedMultipartToJson(req: FastifyRequest): Promise<string> 
{
  const rawBody = req.body as any;
  let file: string = "";
  
  const uploadDir = path.join(process.cwd(), 'uploads', 'avatar');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  for (const key in rawBody) 
  {
    const field = rawBody[key];

    if (field?.type === 'file') 
    {
      const ext = path.extname(field.filename) || '.png';

      let filePath: string;
      let randomName: string;

      do {
          randomName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
          filePath = path.join(uploadDir, randomName);
      } while (fs.existsSync(filePath));

      
      const buffer = await field.toBuffer();
      fs.writeFileSync(filePath, buffer);

      file = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/user/avatars/${randomName}`;
    } 
  }

  return file;
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



export async function iSameUser(userId: number, friendId: number)
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

export async function isReadyExists(username: string | undefined , oldusername : string ) : Promise<boolean>
{
  if (!username) return false;
  const existingProfile = await prisma.profile.findUnique({ where: { username } });
  
  if (existingProfile && username !== oldusername)
    return true;
  return false;
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
  POST: '/create',
  PUT: '/update',
  DELETE : '/delete',
}
// HTTP methods that don't support body
const NO_BODY_METHODS = ['GET', 'DELETE'];

export async function sendServiceRequestSimple(serviceName : string , userId : number, method : string = 'GET', body?: any ) 
{
  const url = SERVICE_URLS[serviceName as keyof typeof SERVICE_URLS] + (ENDPOINTS as any)[method.toUpperCase()];
  
  console.log(`Sending request to ${serviceName} service at ${url} with method ${method} for userId ${userId}`);
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
  else
  {
    //fixed later  missing await
    // await redis.set(cacheKey,{ 
    //   level: profile.level , rankTier: profile.rankTier , 
    //   status: profile.status , rankDivision : profile.rankDivision ,
    //   username : profile.username , avatar : profile.avatar,
    //   firstName : profile.firstName , lastName : profile.lastName ,  
    // });
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
    if(user.playerCharacters.includes(itemName)) throw new Error(`Character ${itemName} already owned.`);
    itemPrice = getCharacterPrice(itemName);
  } 
  else if (itemType === 'playerPaddles')
  {
    if(user.playerPaddles.includes(itemName)) throw new Error(`Paddle ${itemName} already owned.`);
    itemPrice = getPaddlePrice(itemName);
  }

  let existsInRedis = false;
  const userId = user.userId; 
  const userKey = `profile:${userId}`;
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
    new_data['walletBalance'] = newWalletBalance;
  }

  new_data[itemType].push(itemName);
  return new_data[itemType];
}




export async function SelectedItemExists(user: any, itemType: 'playerCharacters' | 'playerPaddles', itemName: string) : Promise<boolean>
{
  if (itemType === 'playerCharacters')
    return user.playerCharacters.includes(itemName);
  else if (itemType === 'playerPaddles')
    return user.playerPaddles.includes(itemName);
  return false;
}




export async function buyVerified(user: any) : Promise<{isVerified: boolean , walletBalance: number}>
{
  const userKey = `profile:${user.userId}`;
  
  if(user.isVerified == true) throw new Error('User is already verified.');
  if(user.walletBalance < 500) throw new Error('Insufficient wallet balance to buy verified status.');
  
  const newWalletBalance = user.walletBalance - 500;
  user.walletBalance = newWalletBalance;

  if (await redis.exists(userKey)) 
    await redis.update(userKey, '$', { isVerified: true });

  return { isVerified: true , walletBalance: newWalletBalance };
}

