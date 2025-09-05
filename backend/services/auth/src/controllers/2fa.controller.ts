import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import redis from '../integration/redisClient';
import QRCode from "qrcode";
import { setJwtTokens } from '../validators/2faValidator';
import { authenticator } from "otplib";
import { TwoFA  , UserProfileMessage } from '../utils/messages';
import { ApiResponse, errorHandler } from '../utils/errorHandler';



export async function setupAuthenticatorHandler(req: FastifyRequest, res: FastifyReply) 
{

  const respond : ApiResponse<{QRCode : string , key : string} > = {success : true  , message : TwoFA.TWO_FA_SETUP_SUCCESS}
  const serviceName = "ft_trandandan";

  try 
  {

    const user = await prisma.user.findFirst({where : {id : Number(req.id)}})
    if(!user)
      throw new Error(UserProfileMessage.USER_NOT_FOUND)

    if(user.is2FAEnabled)
    {
      respond.data = {QRCode : user.twoFAQRCode! , key : user.twoFAKey!}
      return res.send(respond);
    }
    
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.username, serviceName, secret);

    const key = otpauth.split('=')[1].split('&')[0]
    const QRcodeUrl  = await QRCode.toDataURL(otpauth);

    await prisma.user.update({ where: { id: user.id }, data : { twoFASecret: secret , twoFAKey : key , twoFAQRCode : QRcodeUrl },});
    
    respond.data = {QRCode : QRcodeUrl! , key : key!}
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error)
      {
        respond.message = error.message;
        return res.status(400).send(respond)
      }
  }

  return res.send(respond)
}




export async function statusAuthenticatorHandler(req: FastifyRequest, res: FastifyReply) 
{

  const respond : ApiResponse<null > = {success : true  , message : TwoFA.TWO_FA_ENABLED}

  try 
  {

    const user = await prisma.user.findUnique({where : {id : Number(req.id)}})
    if(!user)
      throw new Error(UserProfileMessage.USER_NOT_FOUND)

    if(user.is2FAEnabled)
      throw new Error(TwoFA.TWO_FA_DESABLED)

  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error)
      {
        respond.message = error.message;
        return res.status(400).send(respond)
      }
  }

  return res.send(respond)
}




export async function verifyTwofaHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond : ApiResponse<null > = {success : true  , message : '2fa code success'}
  const body = req.body as any;
  const id = await redis.get(body.token);


  try
  {
    const user = await prisma.user.findUnique({ where: { id : Number(id)} });

    if (!user)
      throw new Error(UserProfileMessage.USER_NOT_FOUND);
    if(!user.is2FAEnabled)
      throw new Error(TwoFA.TWO_FA_DESABLED);
  
    const isValid = authenticator.check(body.code, user.twoFASecret!);
    if (!isValid)
      throw new Error(TwoFA.INVALID_2FA_CODE);

  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error)
      {
        respond.message = error.message;
        return res.status(400).send(respond)
      }
  }

  await setJwtTokens(res , {id});
  return res.send(respond);
}






export async function disable2FAHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond : ApiResponse<null > = {success : true  , message : TwoFA.TWO_FA_DISABLE_SUCCESS}
  const id = req.id as any;

  try 
  {
    const user = await prisma.user.findUnique({ where: { id: Number(id)} });
    
    if (!user)
      throw new Error(UserProfileMessage.USER_NOT_FOUND);
    if(!user.is2FAEnabled)
      throw new Error(TwoFA.TWO_FA_DESABLED);
  
    await prisma.user.update({ where: { id: Number(id) }  , data : {is2FAEnabled : false}})
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error)
      {
        respond.message = error.message;
        return res.status(400).send(respond)
      }
  }

  return res.send(respond);
}



export async function enableTwoFAHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond : ApiResponse<null > = {success : true  , message : TwoFA.TWO_FA_ENABLE_SUCCESS}
  const body = req.body as any;
  const id = req.id as any;

  try 
  {
    const user = await prisma.user.findUnique({ where: { id: Number(id)} });
    if (!user)
      throw new Error(UserProfileMessage.USER_NOT_FOUND);
    if(user.is2FAEnabled)
      throw new Error(TwoFA.TWO_FA_ALREADY_ENABLED);

    const isValid = authenticator.check(body.code, user.twoFASecret!);

    if (!isValid)
      throw new Error(TwoFA.INVALID_2FA_CODE);

    await prisma.user.update({ where: { id: Number(id) }  , data : {is2FAEnabled : true}})
  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error)
      {
        respond.message = error.message;
        return res.status(400).send(respond)
      }
  }


  return res.send(respond);
}