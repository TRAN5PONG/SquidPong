import redis from "../integration/redisClient";

import { sendEmail } from "./sendEmail";



async function generate6DigitCode(): Promise<string> 
{
  const value: string = Math.floor(100000 + Math.random() * 900000).toString();
  // console.log(`verify code : ${value}`)
  // return value;
  return '999999';
}



export async function sendEmailMessage(data: { email: string; type: string })
{
  const {type , email} = data;
  const code: string = await generate6DigitCode();
  let time;
  
  switch(type)
  {
    case 'VERIFY' : time = 300; break;
    case 'RESET' : time = 600; break;
    case '2FA'   : time = 300; break;
    default      : time = 300; break;
  }
  
  const key = `${type}:${email}`;
  await redis.set(key, code, "EX", time);
  // await sendEmail(); // send email function
}









