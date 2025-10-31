import { FastifyRequest, FastifyReply } from 'fastify';
import app from '../app';
import { ApiResponse } from '../utils/errorHandler';
import redis from '../integration/redisClient';


export async function authenticateUser(req: FastifyRequest, res: FastifyReply) 
{

  const respond: ApiResponse<null> = { success: false, message: 'Unauthorized' };
  const url = req.url;

  console.log(`Authenticating request for URL: ${url}`);
  const publicURIs: string[] = [
    '/', '/favicon.ico',
    '/api/user/docs/json',
    '/api/chat/docs',
    '/api/auth/docs/json',
    '/api/user/health',

    '/api/auth/signup', 
    '/api/auth/verify-email', 
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/reset-password', 
    '/api/auth/intra', 
    '/api/auth/google', 
    '/api/auth/refresh'
  ];


  const publicCallbackPrefixes: string[] = [
    '/api/auth/google/callback',
    '/api/auth/intra/callback',
  ];

  const isExactPublic = publicURIs.includes(url);
  const isCallbackPublic = publicCallbackPrefixes.some(prefix => url.startsWith(prefix));

  if ((isExactPublic || isCallbackPublic)) 
    return;

  try 
  {

    const cookie = req.headers.cookie;
    if (!cookie) throw new Error("Not allowed");

    console.log(`Cookie found: ${cookie}`);
    const tokenCookie = cookie.split('; ').find((c:string) => c.startsWith('accessToken='));
    if (!tokenCookie) throw new Error("Not allowed");
    
    const token = tokenCookie.split('=')[1];
    if (!token) throw new Error("Not allowed");
    
    // mode development
    // const tokenExists = await redis.get(token);
    // if (!tokenExists) throw new Error("Token expired or invalid");

    const payload: any = await app.jwt.verify(token);
    req.id = payload.userId;
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error)
      respond.message = error.message;

    return res.status(400).send(respond);
  }


}
