import { FastifyRequest, FastifyReply } from 'fastify';
import app from '../app';
import { ApiResponse } from '../utils/errorHandler';
import redis from '../integration/redisClient';


export async function authenticateUser(req: FastifyRequest, res: FastifyReply)
{

  const respond: ApiResponse<null> = { success: false, message: 'Unauthorized' };

  const publicURIs: string[] = [
    '/', '/favicon.ico',
    '/api/auth/signup', '/api/auth/login', '/api/auth/verify-email',
    '/api/auth/reset-password', '/api/auth/forgot-password',
    '/api/auth/intra',
    '/api/auth/intra/callback',
    '/pages/signup.html', '/api/auth/refresh', '/api/user/docs/json', '/pages/verification.html', '/pages/login.html',
  ];

  const isPublic = publicURIs.includes(req.url) || req.url.startsWith('/docs') || req.url.startsWith('/api/auth/');
  if (isPublic) return;

  try 
  {
    const cookie = req.headers.cookie;
    if (!cookie) throw new Error("Not allowed");

    const token = cookie.split('=')[1];
    if (!token) throw new Error("Missing access token");

    // 1️⃣ Check token in Redis
    const tokenExists = await redis.get(token);
    if (!tokenExists) throw new Error("Token expired or invalid");

    // 2️⃣ Verify JWT
    const payload: any = await app.jwt.verify(token);

    req.id = payload.userId;

  } 
  catch (error) 
  {
    return res.status(401).send(respond);
  }
}
