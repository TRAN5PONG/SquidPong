import redis from "../integration/redisClient";
import { hashPassword } from "./hashedPassword";
import { sendDataToQueue } from "../integration/rabbitmqClient";




export async function sendVerificationEmail(data: any)
{
  data.password = await hashPassword(data.password);
  await redis.set(data.email, JSON.stringify(data), "EX", "260");
  await sendDataToQueue({email : data.email}, "emailhub");

}
