import { FastifyRequest, FastifyReply } from 'fastify';
import { sendVerificationEmail , sendCodeToEmail } from '../utils/verification_messenger';
import { OAuth2Namespace } from '@fastify/oauth2';
import { isUserVerified , isResetCodeValid , isUserAlreadyRegistered  , isUserAllowedToLogin} from '../validators/userStatusCheck';
import { createAccount } from '../utils/utils';
import { isTwoFactorEnabled } from '../validators/2faValidator';
import { ApiResponse , sendError } from '../utils/errorHandler';
import { VerifyPassword , hashPassword } from '../utils/hashedPassword';
import { sendDataToQueue } from '../integration/rabbitmq.integration';
import redis from '../integration/redis.integration';
import prisma from '../db/database';
import { PasswordMessage ,EmailMessage , AuthError, UserProfileMessage } from '../utils/messages';
import { fetchIntraToken , fetchGoogleUser , fetchIntraUser , sendResponseToFrontend } from '../utils/oauthHelpers';
import {fetchAvatarImagePipeline} from '../utils/oauthHelpers';




import app from '../app';

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}




export async function postSignupHandler(req:FastifyRequest , res:FastifyReply)
{
  const respond : ApiResponse<null > = {success : true  , message : EmailMessage.EMAIL_VERIFICATION_SENT}
  const {email , username , password , firstName , lastName} = req.body as {email : string , username : string , password : string , firstName : string , lastName : string};
  
  try
  {
    await isUserAlreadyRegistered(email , username , respond);
    await sendVerificationEmail({email , password , username , firstName , lastName});
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
  const {email , code} = req.body as {email : string , code : string};

  console.log("verifyEmailHandler called with email:", email, "and code:", code);
    try 
    {
      await isUserVerified(email  , code);
      const data = await redis.get(email);
      if(!data) throw new Error(AuthError.VALIDATION_ERROR)
      
      const parsed = JSON.parse(data);
      console.log("Data retrieved from Redis for email verification:", parsed);
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
  const respond : ApiResponse<{ is2FAEnabled: boolean; twoFAToken?: string }> = {success : true  , message : AuthError.LOGIN_SUCCESSFUL , data : { is2FAEnabled : false}}

  const {email , username , password} = req.body as {email? : string , password : string , username ?: string};
  try 
  {
    let user ;
    if(email)
      user = await prisma.user.findUnique({ where: { email }})
    else if(username)
      user = await prisma.user.findUnique({ where: { username }})

    if(!user) throw new Error(UserProfileMessage.USER_NOT_FOUND)

    await isUserAllowedToLogin(password , user);
    await isTwoFactorEnabled(user.id, user.twoFAMethod, res, respond);
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


    fetch(`http://user:4002/api/user/me`, {
      method: "DELETE",
      headers : {"x-user-id": `${id}` , 'x-secret-token': process.env.SECRET_TOKEN || '' }
    })

    respond.success = true;
    respond.message = `Account  ${user.username} deleted successfully`;
    
  } 
  catch (error) 
  {
    sendError(res, error);
  }

  return res.send(respond);
}



export async function getGooglCallbackehandler(req: FastifyRequest, res: FastifyReply)
{

  const respond: ApiResponse<{ is2FAEnabled: boolean; twoFAToken?: string }> = { success: true, message:  'login success' };
  respond.data = { is2FAEnabled: false};

  try 
  {
    const googleData = await fetchGoogleUser(req);
    
    const avatar = await fetchAvatarImagePipeline(googleData.avatar, googleData.email.split('@')[0]);
    const user = await createAccount({email : googleData.email , username : googleData.email.split('@')[0] , firstName : googleData.given_name, lastName : googleData.family_name , avatar});
    await isTwoFactorEnabled(user.id, user.twoFAMethod, res, respond);
  } 
  catch (error) 
  {
    sendError(res, error);
  }

  sendResponseToFrontend(res, respond);
}



export async function getIntrahandler(req:FastifyRequest , res:FastifyReply) 
{
  const client_id = process.env.INTRA_CLIENT_ID;
  const BACKEND_URL = process.env.BACKEND_URL;
  const redirect_uri = encodeURIComponent(`${BACKEND_URL}/api/auth/intra/callback`);
  const URL = `https://api.intra.42.fr/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code`;
  return res.redirect(URL);
}



export async function getIntracallbackhandler(req: FastifyRequest, res: FastifyReply)
{
  const respond: ApiResponse<{ is2FAEnabled: boolean; twoFAToken?: string }> = { success: true, message: 'created account'};

  respond.data = { is2FAEnabled: false };
  const { code } = req.query as any;

  try
  {
    const access_token = await fetchIntraToken(code);
    const userJSON = await fetchIntraUser(access_token);
    if (!userJSON || !userJSON.username || !userJSON.avatar) 
    {
      respond.success = false;
      respond.message = 'Failed to fetch user data from Intra.42';
      return sendResponseToFrontend(res, respond);
    }
    const avatar = await fetchAvatarImagePipeline(userJSON.avatar, userJSON.username);
    const account = await createAccount({email : userJSON.email , username : userJSON.username , firstName : userJSON.firstName, lastName : userJSON.lastName , avatar});
    await isTwoFactorEnabled(account.id, account.twoFAMethod, res, respond);
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
  const {email , username} = req.body as {email? : string , username? : string};
  
  let user;
  try 
  {
    if(email)
      user = await prisma.user.findUnique({ where: { email }})
    else if(username)
      user = await prisma.user.findUnique({ where: { username }})
    if(!user) throw new Error(  UserProfileMessage.USER_NOT_FOUND)

    sendCodeToEmail(user.email , "RESET");
  } 
  catch (error) 
  {
    sendError(res, error);
  }

  return res.send(respond);
}



export async function postResetPasswordHandler(req: FastifyRequest, res: FastifyReply) 
{

  const respond : ApiResponse<null > = {success : true  , message : PasswordMessage.PASSWORD_CHANGED_SUCCESS}
  const {email , username  , newPassword , code } = req.body as {email? : string , username? : string , newPassword : string , code : string};

  try 
  {
    let user;
    if(email)
      user = await prisma.user.findUnique({ where: { email }})
    else if(username)
      user = await prisma.user.findUnique({ where: { username }})
    if(!user) throw new Error(UserProfileMessage.USER_NOT_FOUND)

    if(!user.password) throw new Error(UserProfileMessage.U_HAVE_ACCOUNT_OAUTH)
    await isResetCodeValid(user.email , user.password , newPassword , code);
    await prisma.user.update({ where: { id : user.id}  , data : {password : await hashPassword(newPassword)} })
  } 
  catch (error) 
  {
    sendError(res, error);
  }
  
  return res.send(respond);
}


export async function postChangePasswordHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond : ApiResponse<null > = {success : true  , message : PasswordMessage.PASSWORD_CHANGED_SUCCESS}
  const headers = req.headers as any;
  const id = Number(headers['x-user-id'])
  
  const {oldPassword , newPassword} = req.body as any;
  try 
  {
    const user = await prisma.user.findFirst({ where: { id }});
    if(!user) throw new Error(UserProfileMessage.USER_NOT_FOUND);
    if(!user.password) throw new Error(UserProfileMessage.U_HAVE_ACCOUNT_OAUTH)

    if(!await VerifyPassword(oldPassword , user.password)) throw new Error(PasswordMessage.CURRENT_PASSWORD_INCORRECT)
    await prisma.user.update({ where: { id}  , data : {password : await hashPassword(newPassword)} })
  } 
  catch (error) 
  {
    sendError(res, error);
  }

  return res.send(respond);
}

export async function postUpdateAuthHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: 'User updated successfully' };
  const { username } = req.body as { username: string };
  const headers = req.headers as any;
  const id = Number(headers['x-user-id']);

  const secretToken = req.headers['x-secret-token'] as string;
  try 
  {
    console.log("postUpdateAuthHandler called with id:", id, "and new username:", username);
    if (secretToken !== process.env.SECRET_TOKEN)
      throw new Error('Unauthorized: Invalid secret token');

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    await prisma.user.update({ where: { id }, data: { username } });
  } 
  catch (error) {
    return sendError(res, error);
  }

  return res.send(respond);
}

