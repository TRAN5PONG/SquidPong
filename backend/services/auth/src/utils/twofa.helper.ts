import prisma from '../db/database';
import redis from '../integration/redis.integration';
import QRCode from "qrcode";
import { setJwtTokens } from '../validators/2faValidator';
import { authenticator } from "otplib";
import { TwoFA  , UserProfileMessage ,  TwoFaEmaiL } from '../utils/messages';
import { sendCodeToEmail } from './verification_messenger';

enum TwoFAMethod 
{
  NONE = "none",
  AUTHENTICATOR = "authenticator",
  EMAIL = "email",
}


export const {NONE , AUTHENTICATOR , EMAIL} = TwoFAMethod;


const serviceName = "SquidPong";

export async function setupAuthenticatorApp(user: any) 
{

  if(user.twoFAKey != null)
    return { twoFAQRCode: user.twoFAQRCode, twoFAKey: user.twoFAKey };

    const twoFASecret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.username, serviceName, twoFASecret);
    const twoFAKey = otpauth.split("=")[1].split("&")[0];
    const twoFAQRCode = await QRCode.toDataURL(otpauth, {
    color: {
    dark: '#1B1B1B',
    light: '#ffffffff'
    }
    });

    await prisma.user.update({
      where: { id : user.id },
      data: { twoFASecret, twoFAKey, twoFAQRCode,},
    });

    return { twoFAQRCode, twoFAKey };
 
}





export async function setupEmail2FA(email: string) 
{
  try 
  {
    await sendCodeToEmail(email , "2FA");
  } 
  catch (err) {
    console.error("Error setting up Email 2FA:", err);
    throw new Error("Failed to setup Email 2FA");
  }
}



function generateEmailCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

async function sendTwoFACodeEmail(email: string, code: string) 
{
  console.log(`Sending 2FA code ${code} to email: ${email}`);
}




export async function enableAuthenticatorCode(id: number,twoFASecret : string , code: string)
{

  if(!twoFASecret)
    return false;
    // throw new Error("2FA secret not found. Please setup 2FA first.");

  const isValid = authenticator.check(code, twoFASecret);
  if (!isValid)
    return false;

  await prisma.user.update({
    where: { id },
    data: { twoFAMethod: AUTHENTICATOR },
    });
  
}


export async function enableEmailCode(email: string, code: string)
{

  const storedCode = await redis.get(`2FA:${email}`);
  if (!storedCode) throw new Error(TwoFaEmaiL.TWO_FA_EMAIL_EXPIRED);
  if (storedCode !== code) throw new Error(TwoFaEmaiL.INVALID_2FA_CODE);
  
  await redis.del(`2FA:${email}`);
  await prisma.user.update({
    where: { email },
    data: { twoFAMethod: EMAIL },
  });

}





export async function verifyAuthenticatorCode(id: number,twoFASecret : string , code: string)
{

  const isValid = authenticator.check(code, twoFASecret);
  if (!isValid)
    throw new Error(TwoFA.INVALID_2FA_CODE);
  
}




export async function verifyEmailCode(userId: number, code: string)
{

  const storedCode = await redis.get(`2fa:email:${userId}`);
  if (!storedCode)
    throw new Error(TwoFaEmaiL.TWO_FA_EMAIL_EXPIRED);
    
  if (storedCode !== code)
    throw new Error(TwoFaEmaiL.INVALID_2FA_CODE);
      
  await redis.del(`2fa:email:${userId}`);
  

}


