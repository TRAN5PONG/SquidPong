import {FastifyReply } from "fastify";
import app from "../app";
import prisma from "../db/database";
import { sendDataToQueue } from "../integration/rabbitmqClient";
import redis from "../integration/redisClient";
import { ApiResponse } from "../utils/errorHandler";




export async function setJwtTokens(res: FastifyReply, userId: string) 
{
  const accessToken = await app.jwt.sign({ userId }, { expiresIn: "7d" });
  const refreshToken = await app.jwt.sign({ userId }, { expiresIn: "7d" });

  res.setCookie("accessToken", accessToken, { httpOnly: true, path: "/", sameSite: "lax", secure: false });
  res.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60,
  });

  await redis.set(accessToken, "valid", "EX", 60 * 24 * 7 * 60);

}






export async function isTwoFactorEnabled(res: FastifyReply, user: {is2FAEnabled : boolean , userId : string} , respond: ApiResponse ) : Promise<any>
{

  const {userId , is2FAEnabled} = user;
  if(!is2FAEnabled)
  {
    respond.data.is2FAEnabled = false;
    await setJwtTokens(res , userId);
    return ;
  }
  
  respond.data.is2FAEnabled = true;
}



















