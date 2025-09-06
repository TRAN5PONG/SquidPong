import { FastifyRequest, FastifyReply } from 'fastify';
import app from '../app';
import { ApiResponse } from '../utils/errorHandler';
import redis from '../integration/redisClient';
import { getUserIdFromRequest } from '../utils/utils';

export async function authenticateUser(req: FastifyRequest, res: FastifyReply) 
{

  const respond: ApiResponse<null> = { success: false, message: 'Unauthorized' };
  const url = req.url;

  const publicURIs: string[] = [
    '/', '/favicon.ico',
    '/api/user/docs/json',
    '/api/auth/docs/json',
    '/api/auth/signup', 
    '/api/auth/login', 
    '/api/auth/verify-email', 
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

    req.id = await getUserIdFromRequest(req, app);
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error)
      respond.message = error.message;

    return res.status(400).send(respond);
  }

}
