import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import prisma from '../db/database';
import { redis } from '../integration/redis.integration';

import path from 'path';
import crypto from 'crypto';



export async function verifyFriendship(senderId: string, receiverId: string) 
{
  const res = await fetch(`http://user:4002/api/friend/verify/${receiverId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-token': process.env.SECRET_TOKEN || '',
      'x-user-id': senderId,
    }});

  if(res.status !== 200)
    throw new Error('Failed to verify friendship status.');
  const data = await res.json();
  if(!data.success || !data.data?.areFriends)
    throw new Error('Users are not friends.');
}



export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T | undefined;
};






export function sendError(res: FastifyReply, error: unknown, statusCode = 400) 
{
  const message = error instanceof Error ? error.message : String(error);

  const response: ApiResponse<null> = {
    success: false,
    message,
    data: null,
  };

  return res.status(statusCode).send(response);
}


export async function fetchAndEnsureUser(userId: string) 
{
  let user;
  const key = `profile:${userId}`;

  if(await redis.exists(key))
    return await redis.get(key);

  user = await prisma.user.findUnique({ where: { userId }});
  if(!user) throw new Error('User not found ');
  return user;
}




export function checkSecretToken(req: FastifyRequest)
{
  const secretToken = req.headers['x-secret-token'] as string;
  if (secretToken !== process.env.SECRET_TOKEN)
    throw new Error('Unauthorized: Invalid secret token');
}



export async function convertParsedMultipartToJson(req: FastifyRequest): Promise<{imageUrl : string}> 
{
  const rawBody = req.body as any;
  let file: string = "";
  
  const uploadDir = path.join(process.cwd(), 'uploads', 'group-images');
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

      file = `${process.env.BACKEND_URL || 'http://localhost:4000'}:4433/api/user/avatars/${randomName}`;
    } 
  }

  return {imageUrl : file} ;
}