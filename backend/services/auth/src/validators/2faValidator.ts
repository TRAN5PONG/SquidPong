import {FastifyReply } from "fastify";
import app from "../app";
import prisma from "../db/database";
import { sendDataToQueue } from "../integration/rabbitmqClient";
import redis from "../integration/redisClient";
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



export async function setJwtTokens(res: FastifyReply, user: any | null) 
{
  const accessToken = await app.jwt.sign({ userId: user.id }, { expiresIn: "7d" });
  const refreshToken = await app.jwt.sign({ userId: user.id }, { expiresIn: "30d" });

  res.setCookie("accessToken", accessToken, { httpOnly: true, path: "/", sameSite: "lax", secure: false });
  res.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    path: "/api/auth/refresh",
    maxAge: 30 * 24 * 60 * 60,
  });

  await redis.set(accessToken, "valid", "EX", 60 * 24 * 7 * 60);
}






export async function isTwoFactorEnabled(res: FastifyReply, user: any | null , respond: ApiResponse ) : Promise<any>
{

  if(user.twoFAMethod == "none")
  {
    respond.data.is2FAEnabled = false;
    await setJwtTokens(res , user);
    return ;
  }
  
  respond.data.is2FAEnabled = true;
  const message = (user.twoFAMethod == "email") ? "A verification code has been sent to your email." : "Please enter the code from your authenticator app.";
  respond.message = message;
}



















