import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { convertParsedMultipartToJson } from '../utils/utils';
import { ApiResponse } from '../utils/errorHandler';
import { Profile } from '../utils/types';
import redis from '../utils/redis';

const CACHE_TTL = 60;


export async function createProfileHandler(req: FastifyRequest, res: FastifyReply)
{
  
  const respond: ApiResponse<null> = { success: true, message: 'User created successfully' };
  const body = req.body as any;

  const profileData:any = {
    userId: body.id,
    username: body.username,
    firstName: body.fname,
    lastName: body.lname,
    avatar : body.avatar,
  };


  try 
  {

    await prisma.profile.create({
    data: {
      ...profileData,
      preferences: { create: { notifications: { create: {} } } },
    },

  });

  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) {
      respond.message = error.message;
      return res.status(400).send(respond);
    }
  }

  return res.send(respond);
}


export async function updateProfileWithMultipart(body: any, userId: number) 
{

  const profile = await prisma.profile.findUnique({ where: { userId }});
  if (!profile) throw new Error("Profile not found");

  const mergedBody = { ...body };
  const jsonArrayFields: (keyof typeof profile)[] = ["playerCharacters", "playerPaddles"];


  for (const field of jsonArrayFields) 
  {
  if (body[field]) 
    {
    const currentArray: any = profile[field] as any[] || [];
    const newArray = Array.isArray(body[field]) ? body[field] : [body[field]];
    mergedBody[field] = [...new Set([...currentArray, ...newArray])];
    }
  }


  const updatedProfile =  await prisma.profile.update({
  where: { userId },
  data: {
    ...Object.fromEntries( Object.entries(mergedBody).filter(([key]) => key !== "preferences")),
    ...(mergedBody.preferences && { preferences: { update: { data: mergedBody.preferences, }}}),
  },
  });
    
  return updatedProfile;

}

export async function updateProfileHandler(req: FastifyRequest, res: FastifyReply) 
{

  const respond: ApiResponse<any> = { success: true, message: 'User updated successfully' };

  try 
  {
    const body = await convertParsedMultipartToJson(req);
    const headers = req.headers as any;
    const userId = Number(headers['x-user-id']);
    respond.data = updateProfileWithMultipart(body , userId);

  }

  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) 
      {
      respond.message = error.message;
      return res.status(400).send(respond);
      }
  }

  return res.send(respond);
}





export async function getAllUserHandler(req: FastifyRequest, res: FastifyReply)
{
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  const respond: ApiResponse<Profile[]> = { success: true, message: 'Users fetched successfully' };

  try 
  {

    const profiles = await prisma.profile.findMany({
    include: {
      preferences: { include: { notifications: true } },
    }
  })

  respond.data = profiles;
  
  } 
  catch (error) 
  {

    respond.success = false;
    if (error instanceof Error) {
      respond.message = error.message;
      return res.status(400).send(respond);
    }
  }

  return res.send(respond);
}



export async function deleteProfileHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<null> = { success: true, message: 'User deleted successfully' };
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);

  try 
  {
    await prisma.profile.delete({ where: { userId }});
    // await redis.del(`profile:${userId}`);

  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) {
      respond.message = error.message;
      return res.status(400).send(respond);
    }
  }

  return res.send(respond);
}



export async function getCurrentUserHandler(req: FastifyRequest, res: FastifyReply) 
{
  const headers = req.headers as any;
  const userId = Number(headers['x-user-id']);
  const respond: ApiResponse< any> = { success: true, message: 'Current user fetched' };

  try 
  {
    // const cacheKey = `profile:${userId}`;
    // const cached = await redis.get(cacheKey);

    // if (cached) 
    //   {
    //   respond.data = JSON.parse(cached);
    //   return res.send(respond);
    //   }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        preferences: { include: { notifications: true } },
      }
    });

    respond.data = profile;
    // await redis.set(cacheKey, JSON.stringify(profile), 'EX', CACHE_TTL);

  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) {
      respond.message = error.message;
      return res.status(400).send(respond);
    }
  }

  return res.send(respond);
}



export async function getUserByIdHandler(req: FastifyRequest, res: FastifyReply) 
{

  const { id } = req.params as any;
  const respond: ApiResponse<Profile | any> = { success: true, message: 'User fetched' };

  try 
  {
    // const cacheKey = `profile:${id}`;
    // const cached = await redis.get(cacheKey);

    // if (cached) 
    //   {
    //   respond.data = JSON.parse(cached);
    //   return res.send(respond);
    //   }

    const profile = await prisma.profile.findUnique({
      where: { userId: Number(id) },
      include: {
        
        preferences: { include: { notifications: true } },
      
      }
    });

    if(!profile)
      throw new Error("User not found in the database.");
    respond.data = profile;
    // await redis.set(cacheKey, JSON.stringify(profile), 'EX', CACHE_TTL);

  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) {
      respond.message = error.message;
      return res.status(400).send(respond);
    }
  }

  return res.send(respond);
}



// export async function deleteAccountHandler(req: FastifyRequest, res: FastifyReply) 
// {
//   const respond: ApiResponse<null> = { success: false, message: "Account deletion failed" };
//   const headers = req.headers as any;
//   const userId = Number(headers['x-user-id']);

//   try 
//   {

//     await prisma.profile.delete({ where: { userId } });

//     respond.success = true;
//     respond.message = "Account deleted successfully";
    
//   } 
//   catch (error) 
//   {
//     if (error instanceof Error) {
//       respond.message = error.message;
//       return res.status(400).send(respond);
//     }
//     return res.status(500).send(respond);
//   }

//   return res.send(respond);
// }



export async function searchUsersHandler(req: FastifyRequest, res: FastifyReply) 
{
  const respond: ApiResponse<any> = { success: true, message: 'Search results fetched' };

  try 
  {
    // const query = req.query as any;
    // const search = query.q as string;

    // if (!search)
    //   throw new Error("Search query is required")


    // const users = await prisma.profile.findMany({
    //   where: {
    //     OR: [
    //       { username: { contains: search, mode: 'insensitive' } },
    //       { fname: { contains: search, mode: 'insensitive' } }
    //     ]
    //   },
    //   select: {
    //     id: true,
    //     username: true,
    //     fname: true,
    //     lname: true,
    //     email: true,
    //   },
    // });

    // respond.data = users;

  } 
  catch (error) 
  {
    respond.success = false;
    if (error instanceof Error) respond.message = error.message;
    return res.status(400).send(respond);
  }

  return res.send(respond);
}
