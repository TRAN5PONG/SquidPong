import {FastifyReply } from "fastify";
import app from "../app";
import prisma from "../db/database";
import { sendDataToQueue } from "../integration/rabbitmq.integration";
import redis from "../integration/redis.integration";
import { ApiResponse } from "../utils/errorHandler";


function generateToken(length = 10) 
{
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}



export async function setJwtTokens(res: FastifyReply, userId: number) 
{

  // here check is user is ready have token or not if have token in redis just return it

  const accessToken = await app.jwt.sign({ userId }, { expiresIn: "7d" });
  const refreshToken = await app.jwt.sign({ userId}, { expiresIn: "30d" });

  res.setCookie("accessToken", accessToken, { httpOnly: true, path: "/", sameSite: "lax", secure: false });
  res.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    path: "/api/auth/refresh",
    maxAge: 30 * 24 * 60 * 60,
  });

  await redis.set(accessToken, "valid", "EX", 60 * 24 * 7 * 60);
}






export async function isTwoFactorEnabled(userId : number ,  twoFAMethod : string , res: FastifyReply, respond: ApiResponse ) : Promise<any>
{

  if(twoFAMethod == "none")
  {
    respond.data.is2FAEnabled = false;
    await setJwtTokens(res , userId);
    return ;
  }
  
  const twoFAToken = generateToken(); 
  const redisKey = `2fa:token:${twoFAToken}`;
  await redis.set(redisKey, JSON.stringify({ userId, twoFAMethod }), 'EX', 5 * 60); // Expires in 5 minutes
  
  const message = (twoFAMethod == "email") ? "A verification code has been sent to your email." : "Please enter the code from your authenticator app.";
  
  respond.data = { is2FAEnabled: true , twoFAToken };
  respond.message = message;
}



















