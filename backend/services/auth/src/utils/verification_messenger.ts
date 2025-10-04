import redis from "../integration/redisClient";
import { hashPassword } from "./hashedPassword";
import { sendDataToQueue } from "../integration/rabbitmqClient";



export async function sendVerificationEmail(data: any)
{
  const { email } = data;
  const type = "VERIFY";
  
  data.password = await hashPassword(data.password);
  
  await redis.set(email, JSON.stringify(data), "EX", "300");
  await sendDataToQueue({type : 'emailhub' , data : {email , type}}, "notification");
}


export async function sendCodeToEmail(email: string , type : string)
{
  await sendDataToQueue({type : 'emailhub' , data : {email , type}}, "notification");
}