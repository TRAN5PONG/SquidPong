
import redis from "../integration/redisClient";



export async function isUserOnline(to: string): Promise<boolean> 
{
  const socketKey = `user:${to}:sockets:chat-notification`;
  const exists = await redis.exists(socketKey);
  return exists === 1;
}