import redis from "../integration/redisClient";
import { hashPassword } from "./hashedPassword";
import { sendDataToQueue } from "../integration/rabbitmqClient";



function generateVerificationCode(): string 
{
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}


export async function sendVerificationEmail(data: any)
{
  const verificationCode = generateVerificationCode();
  data.password = await hashPassword(data.password);
  const key = `verification:${data.email}`;
  await redis.set(key, JSON.stringify(data), "EX", "260");
  await sendDataToQueue({email : data.email  , code : verificationCode}, "emailhub");

}
