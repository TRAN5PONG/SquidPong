import redis from "../integration/redis.integration";

import { sendEmail } from "./sendEmail";
import { channel } from "../integration/rabbitmq.integration";


async function generate6DigitCode(): Promise<string> 
{
  const value: string = Math.floor(100000 + Math.random() * 900000).toString();
  // console.log(`verify code : ${value}`)
  // return value;
  return '999999';
}



export async function sendEmailMessage(msg : any)
{
  const data = JSON.parse(msg.content.toString());
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
  channel.ack(msg);
  await sendEmail(); // send email function
}









