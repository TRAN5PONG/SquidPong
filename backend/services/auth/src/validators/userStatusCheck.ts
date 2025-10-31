
import prisma from "../db/database";
import { sendDataToQueue } from "../integration/rabbitmq.integration";
import redis from "../integration/redis.integration";
import { VerifyPassword } from "../utils/hashedPassword";
import { UserProfileMessage ,EmailMessage ,PasswordMessage } from "../utils/messages";


enum typeOfStatus
{
  VERIFY = 'VERIFY',
  RESET  = 'RESET',
  TWOFA  = '2FA'
}

const { VERIFY , RESET , TWOFA } = typeOfStatus;

export async function isUserVerified(email:string , code:string)
{
  const userdb = await prisma.user.findUnique({ where: { email}})
  if(userdb && userdb.password)
    throw new Error(EmailMessage.EMAIL_ALREADY_VERIFIED);

  const codeRedis = await redis.get(`${VERIFY}:${email}`);
  if(!codeRedis)  throw new Error(EmailMessage.VERIFICATION_TOKEN_EXPIRED)

  if(codeRedis != code) throw new Error(EmailMessage.INVALID_VERIFICATION_TOKEN)
  await redis.del(`${VERIFY}:${email}`);
}





export async function isUserAllowedToLogin(password:string , user:any | null)
{
    if(!user)
      throw new Error(UserProfileMessage.USER_NOT_FOUND)

    if(!user.password)
        throw new Error(UserProfileMessage.OAUTH_LOGIN_REQUIRED)

    if(await VerifyPassword(password , user.password) ==  false)
      throw new Error(UserProfileMessage.INVALID_CREDENTIALS)

}


export async function isUserAlreadyRegistered(email: string, username: string , respond : any) 
{
  const userByEmail = await prisma.user.findUnique({ where: { email } });
  const userByUsername = await prisma.user.findUnique({ where: { username } });

  if (userByEmail && userByUsername && userByEmail.id === userByUsername.id) 
  {
    if (userByEmail.password !== null)
      throw new Error(UserProfileMessage.USER_ALREADY_EXISTS);

    respond.message = EmailMessage.USER_NOW_LINKED_ACCOUNT;
    return ;
  }

  if (userByEmail)
    throw new Error(EmailMessage.EMAIL_ALREADY_REGISTERED);

  if (userByUsername)
    throw new Error(UserProfileMessage.USERNAME_ALREADY_TAKEN);

}



export async function isResetCodeValid(email: string , oldPassword : string, newPassword:string , code:string )
{
  
  const key = `${RESET}:${email}`;
  const codeRedis = await redis.get(key);
  if(!codeRedis)
  {
    await sendDataToQueue({type : 'emailhub' , data : {email , type : RESET}}, "notification");
    throw new Error(PasswordMessage.RESET_TOKEN_EXPIRED)
  }
  
  if(codeRedis != code) throw new Error(PasswordMessage.INVALID_RESET_TOKEN)
  
  console.log(oldPassword , newPassword);
  if(await VerifyPassword(newPassword , oldPassword)) throw new Error(PasswordMessage.PASSWORD_SAME_AS_OLD)

  await redis.del(`RESET:${email}`)
    
}
