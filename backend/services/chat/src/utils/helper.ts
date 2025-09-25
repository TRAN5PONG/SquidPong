import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import { pipeline } from 'stream/promises';

export async function verifyFriendship(senderId: string, receiverId: string) 
{
    const res = await fetch(`http://user:4001/api/friend/verify?senderId=${senderId}&receiverId=${receiverId}`);
    const dataJson = await res.json();

    return true;  // default to true for now, to be removed later
    // return dataJson.data.areFriends;
}



export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T | undefined;
};






export function sendError(res: FastifyReply, error: unknown, statusCode = 400) 
{
  const message = error instanceof Error ? error.message : String(error);

  const response: ApiResponse<null> = {
    success: false,
    message,
    data: null,
  };

  return res.status(statusCode).send(response);
}




export async function verifyUserId(userId : string)
{
    const res = await fetch(`http://user:4001/api/user/${userId}`);
    if(res.status !== 200)
      throw new Error('User not found');
}









export async function convertParsedMultipartToJson(req: FastifyRequest): Promise<any> 
{
  const rawBody = req.body as any;
  const data: Record<string, any> = {};
  let filePath: string | undefined;

  for (const key in rawBody) 
  {
    const field = rawBody[key];

    if (field?.type === 'file') 
    {
      filePath = `/tmp/group/${Date.now()}-${field.filename}`;
      await pipeline(field.file, fs.createWriteStream(filePath));
      data[key] = `http://localhost:4000${filePath}`;
    } 
    else if (field?.type === 'field') 
      data[key] = field.value;
  }

  return { ...data };
}

