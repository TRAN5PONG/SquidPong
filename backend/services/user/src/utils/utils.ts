import fs from 'fs';
import { pipeline } from 'stream/promises';
import { FastifyRequest } from 'fastify';
import prisma from '../db/database';



export async function convertParsedMultipartToJson(req: FastifyRequest): Promise<any> {
  const rawBody = req.body as any;
  const data: Record<string, any> = {};
  let filePath: string | undefined;

  for (const key in rawBody) 
    {
    const field = rawBody[key];

    if (field?.type === 'file') 
    {
      filePath = `/tmp/images/${Date.now()}-${field.filename}`;
      await pipeline(field.file, fs.createWriteStream(filePath));
      data[key] = `${process.env.URL}${filePath}`;
    } 
    else if (field?.type === 'field') 
      data[key] = field.value;
  }

  return { ...data };
}



// Helper to get profile ID from userId
export async function getProfileId(userId: number): Promise<string> 
{

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new Error(`Profile not found for userId ${userId}`);
  return profile.id;
}
