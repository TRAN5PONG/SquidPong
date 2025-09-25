import { FastifyRequest, FastifyReply } from 'fastify';
import { sendVerificationEmail } from '../utils/verification_messenger';
import { OAuth2Namespace } from '@fastify/oauth2';
import { isUserVerified , isResetCodeValid , isUserAlreadyRegistered  , isUserAllowedToLogin} from '../validators/userStatusCheck';
import { createAccount } from '../utils/utils';
import { isTwoFactorEnabled } from '../validators/2faValidator';
import { ApiResponse } from '../utils/errorHandler';
import { VerifyPassword } from '../utils/hashedPassword';
import { hashPassword } from '../utils/hashedPassword';
import { sendDataToQueue } from '../integration/rabbitmqClient';
import redis from '../integration/redisClient';
import prisma from '../db/database';
import app from '../app';
import { PasswordMessage ,EmailMessage , AuthError, UserProfileMessage } from '../utils/messages';
import { fetchIntraToken , fetchGoogleUser , fetchIntraUser , sendResponseToFrontend } from '../utils/oauthHelpers';
import { sendError } from '../utils/errorHandler';



declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}





export async function getRootHandler(req:FastifyRequest , res:FastifyReply)
{
  return res.send({msg : "hello ft_trandandan"})
}


export async function postSignupHandler(req:FastifyRequest , res:FastifyReply)
{
    const respond : ApiResponse<null > = {success : true  , message : EmailMessage.EMAIL_VERIFICATION_SENT}
    const body = req.body as any;

    try
    {
      await isUserAlreadyRegistered(body);
      await sendVerificationEmail(body);
    }
    catch (error) 
    {
      sendError(res, error);
    }
    
  return res.send(respond)
}



export async function verifyEmailHandler(req:FastifyRequest , res:FastifyReply)
{
  const respond : ApiResponse<null > = {success : true  , message : EmailMessage.EMAIL_VERIFIED_SUCCESSFULLY}
  const body = req.body as any;

    try 
    {
      await isUserVerified(body);
      const data = await redis.get(body.email);
      if(!data)
          throw new Error(AuthError.VALIDATION_ERROR)
      const parsed = JSON.parse(data);
      await createAccount(parsed);
    }
    catch (error) 
    {
      sendError(res, error);
    }
  return res.send(respond)
}



export async function postLoginHandler(req:FastifyRequest , res:FastifyReply)
{
    const body = req.body as any;
    const respond : ApiResponse<{is2FAEnabled : boolean} > = {success : true  , message : UserProfileMessage.LOGIN_SUCCESSFUL}
    respond.data = {is2FAEnabled : false}

    try 
    {
      const user = await prisma.user.findUnique({ where: { email: body.email}})
      if(!user)
        throw new Error(UserProfileMessage.USER_NOT_FOUND)

      await isUserAllowedToLogin(body , user);
      await isTwoFactorEnabled(res , user , respond);
    }
    catch (error) 
    {
      sendError(res, error);
    }
    
  return res.send(respond)
}



export async function postLogoutHandler(req:FastifyRequest , res:FastifyReply)
{
  const respond : ApiResponse<null > = {success : true  , message : UserProfileMessage.LOGOUT_SUCCESSFUL}
  
  try
  {
  
    res.clearCookie('accessToken', { path : '/' , httpOnly: true });
    res.clearCookie('refreshToken', { path : '/api/auth/refresh' , httpOnly: true });
  
    const token = req.cookies['accessToken'] as any;
    await redis.del(token);
    
  } 
  catch (error) 
  {
    sendError(res, error);
  }

  return res.send(respond)
}



export async function deleteAccountHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: false, message: UserProfileMessage.DELETE_ACCOUNT_SUCCESS };
  const headers = req.headers as any;
  const id:number = Number(headers['x-user-id']);

  try 
  {

    const user = await prisma.user.findUnique({ where: {id} });
    if (!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);

    await prisma.user.delete({ where: { id } });

    const token = req.cookies['accessToken'] as any;
    await redis.del(token);
  

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");


    fetch(`http://user:4001/api/user/me`, {
      method: "DELETE",
      headers : {"x-user-id": `${id}`}
    })

    respond.success = true;
    respond.message = `Account with id ${id} deleted successfully`;
    
  } 
  catch (error) 
  {
    sendError(res, error);
  }

  return res.send(respond);
}



export async function getGooglCallbackehandler(req: FastifyRequest, res: FastifyReply)
{

  const respond: ApiResponse<{ is2FAEnabled: boolean }> = { success: true, message:  'login success' };
  respond.data = { is2FAEnabled: false};

  try 
  {
    const googleData = await fetchGoogleUser(req);
    
    const user = await createAccount(googleData);
    await isTwoFactorEnabled(res, user, respond);
  } 
  catch (error) 
  {
    sendError(res, error);
  }

  sendResponseToFrontend(res, respond);
}



export async function getIntrahandler(req:FastifyRequest , res:FastifyReply) 
{

  const client_id = process.env.IDINTRA;
  const url =  `https://api.intra.42.fr/oauth/authorize?client_id=${client_id}&redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fapi%2Fauth%2Fintra%2Fcallback&response_type=code`;

 return  res.redirect(url)
}




export async function getIntracallbackhandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<{ is2FAEnabled: boolean }> = { success: true, message: 'login success', };

  respond.data = { is2FAEnabled: false };
  const { code } = req.query as any;

  try
  {
    const access_token = await fetchIntraToken(code);
    const userJSON = await fetchIntraUser(access_token);

    const account = await createAccount(userJSON);
    await isTwoFactorEnabled(res, account, respond);

  }
  catch (error) 
  {
    sendError(res, error);
  }

  sendResponseToFrontend(res, respond);
}





export async function postRefreshTokenHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: AuthError.TOKEN_EXPIRED };

  try 
  {

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      throw new Error(AuthError.UNAUTHORIZED);

    const payload: any = await app.jwt.verify(refreshToken);
    const userId: string = payload.userId;

    const newAccessToken = await app.jwt.sign({ userId }, { expiresIn: "1d" });

    res.setCookie("accessToken", newAccessToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    });

  await redis.set(newAccessToken, "valid", "EX", 60 * 24 * 7 * 60);
  } 
  catch (error) 
  {
    sendError(res, error);
  }

  return res.send(respond);
}




export async function postForgotPasswordHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond : ApiResponse<null > = {success : true  , message : PasswordMessage.PASSWORD_RESET_EMAIL_SENT}
  const headers = req.headers as any;
  const id = Number(headers['x-user-id'])
  
  try 
  {
    const user = await prisma.user.findFirst({ where: { id , password : {not : null} }})
    if(!user)
      throw new Error(  UserProfileMessage.USER_NOT_FOUND)
    const email = user.email;

    // TODO: changed later  to function in utils
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `resetpassword:${email}`;
    await redis.set(key, resetCode, "EX", 600); // Code valid for 10 minutes
    await sendDataToQueue({email , resetCode}, "emailhub");
  
    // End TODO

  } 
  catch (error) 
  {
    sendError(res, error);
  }

  return res.send(respond);
}



export async function postResetPasswordHandler(req: FastifyRequest, res: FastifyReply) 
{

  const respond : ApiResponse<null > = {success : true  , message : PasswordMessage.PASSWORD_RESET_SUCCESS}
  const {confirmPassword , newPassword , code } = req.body as any;

  const headers = req.headers as any;
  const id = Number(headers['x-user-id'])
  try 
  {
    const user = await prisma.user.findFirst({ where: { id , password : {not : null} }})
    if(!user)
      throw new Error(UserProfileMessage.USER_NOT_FOUND)

    isResetCodeValid(code , confirmPassword , newPassword , user);
    await prisma.user.update({ where: { id}  , data : {password : await hashPassword(newPassword)} })

  } 
  catch (error) 
  {
    sendError(res, error);
  }
  
  return res.send(respond);
}


export async function postChangePasswordHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond : ApiResponse<null > = {success : true  , message : PasswordMessage.PASSWORD_RESET_SUCCESS}
  const headers = req.headers as any;
  const id = Number(headers['x-user-id'])
  
  const {oldPassword , newPassword} = req.body as any;

  try 
  {
    const user = await prisma.user.findFirst({ where: { id , password : {not : null} }})
    
    if(!user)
      throw new Error(UserProfileMessage.USER_NOT_FOUND)
    if(await VerifyPassword(oldPassword , user.password) == false)
      throw new Error(PasswordMessage.PASSWORD_SAME_AS_OLD)

    await prisma.user.update({ where: { id}  , data : {password : await hashPassword(newPassword)} })

  } 
  catch (error) 
  {
    sendError(res, error);
  }

  return res.send(respond);
}




